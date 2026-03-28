import 'dotenv/config';

import cors from 'cors';
import crypto from 'crypto';
import express, { type Request, type Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';

const PORT = Number(process.env.PORT ?? 8787);
const DATABASE_PATH = process.env.DATABASE_PATH ?? './backend/auth.sqlite';
const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:8081';

const EmailTransportSchema = z.enum(['console', 'json']);
const EMAIL_TRANSPORT = EmailTransportSchema.safeParse(process.env.EMAIL_TRANSPORT ?? 'console').data ?? 'console';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  reset_token: string | null;
  reset_token_expires: string | null;
};

type AuthedRequest = Request & { userId?: string };

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function requireJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing. Set it in backend/.env');
  }
  return JWT_SECRET;
}

function signAccessToken(userId: string): string {
  const secret = requireJwtSecret();
  return jwt.sign({ sub: userId }, secret, { expiresIn: JWT_EXPIRES_IN });
}

function getResetTokenExpiryIso(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function isExpired(expiresIso: string | null): boolean {
  if (!expiresIso) return true;
  const t = new Date(expiresIso).getTime();
  return Number.isNaN(t) || t < Date.now();
}

async function initDb(): Promise<Database> {
  const db = await open({ filename: DATABASE_PATH, driver: sqlite3.Database });

  await db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expires TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
  `);

  console.log('[auth-backend] SQLite ready at:', DATABASE_PATH);
  return db;
}

function createMailer() {
  if (EMAIL_TRANSPORT === 'json') {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  newPassword: z.string().min(8).max(200),
});

function errorResponse(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function jwtAuthMiddleware(req: AuthedRequest, res: Response, next: () => void) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Missing Authorization header');
  }

  const token = header.slice('Bearer '.length);
  const secret = requireJwtSecret();

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const userId = typeof decoded.sub === 'string' ? decoded.sub : null;
    if (!userId) return errorResponse(res, 401, 'Invalid token');
    req.userId = userId;
    return next();
  } catch (e) {
    console.log('[auth-backend] JWT verify failed:', e);
    return errorResponse(res, 401, 'Invalid or expired token');
  }
}

async function main() {
  const db = await initDb();
  const mailer = createMailer();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/', (_req: Request, res: Response) => {
    return res.json({ status: 'ok', service: 'express-auth', time: nowIso() });
  });

  app.post('/auth/register', async (req: Request, res: Response) => {
    console.log('[auth-backend] POST /auth/register');

    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[auth-backend] register validation error:', parsed.error.flatten());
      return errorResponse(res, 400, 'Invalid input');
    }

    const email = normalizeEmail(parsed.data.email);
    const password = parsed.data.password;

    const existing = await db.get<UserRow>('SELECT * FROM users WHERE email = ?', email);
    if (existing) {
      return errorResponse(res, 409, 'Email already registered');
    }

    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 12);
    const created_at = nowIso();

    await db.run(
      'INSERT INTO users (id, email, password_hash, created_at, reset_token, reset_token_expires) VALUES (?, ?, ?, ?, NULL, NULL)',
      id,
      email,
      password_hash,
      created_at,
    );

    return res.status(201).json({ success: true, user: { id, email, created_at } });
  });

  app.post('/auth/login', async (req: Request, res: Response) => {
    console.log('[auth-backend] POST /auth/login');

    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[auth-backend] login validation error:', parsed.error.flatten());
      return errorResponse(res, 400, 'Invalid input');
    }

    const email = normalizeEmail(parsed.data.email);
    const password = parsed.data.password;

    const user = await db.get<UserRow>('SELECT * FROM users WHERE email = ?', email);
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const token = signAccessToken(user.id);
    return res.json({ token, user: { id: user.id, email: user.email, created_at: user.created_at } });
  });

  app.post('/auth/forgot-password', async (req: Request, res: Response) => {
    console.log('[auth-backend] POST /auth/forgot-password');

    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[auth-backend] forgot-password validation error:', parsed.error.flatten());
      return errorResponse(res, 400, 'Invalid input');
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await db.get<UserRow>('SELECT * FROM users WHERE email = ?', email);

    // Always return 200 to avoid account enumeration.
    if (!user) {
      console.log('[auth-backend] forgot-password requested for non-existing email:', email);
      return res.json({ success: true });
    }

    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_token_expires = getResetTokenExpiryIso(15);

    await db.run(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      reset_token,
      reset_token_expires,
      user.id,
    );

    const resetLink = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(reset_token)}`;

    const mail = {
      from: process.env.MAIL_FROM ?? 'no-reply@example.com',
      to: email,
      subject: 'Reset your password',
      text: `Reset your password using this link (valid for 15 minutes):\n\n${resetLink}`,
    };

    try {
      const info = await mailer.sendMail(mail);
      console.log('[auth-backend] Reset email sent:', { email, resetLink, transport: EMAIL_TRANSPORT, info });
    } catch (e) {
      console.log('[auth-backend] Failed to send email (still returning success):', e);
    }

    return res.json({ success: true });
  });

  app.post('/auth/reset-password', async (req: Request, res: Response) => {
    console.log('[auth-backend] POST /auth/reset-password');

    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[auth-backend] reset-password validation error:', parsed.error.flatten());
      return errorResponse(res, 400, 'Invalid input');
    }

    const { token, newPassword } = parsed.data;

    const user = await db.get<UserRow>('SELECT * FROM users WHERE reset_token = ?', token);
    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    if (isExpired(user.reset_token_expires)) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, 12);

    await db.run(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      password_hash,
      user.id,
    );

    return res.json({ success: true });
  });

  // Example protected endpoint (useful for frontend integration tests)
  app.get('/auth/me', jwtAuthMiddleware, async (req: AuthedRequest, res: Response) => {
    console.log('[auth-backend] GET /auth/me', { userId: req.userId });
    const user = await db.get<UserRow>('SELECT id, email, created_at, password_hash, reset_token, reset_token_expires FROM users WHERE id = ?', req.userId);
    if (!user) return errorResponse(res, 404, 'User not found');

    return res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    });
  });

  app.use((_req: Request, res: Response) => {
    return res.status(404).json({ error: 'Not found' });
  });

  app.listen(PORT, () => {
    console.log(`[auth-backend] Express listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error('[auth-backend] Fatal error:', e);
  process.exit(1);
});
