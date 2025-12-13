import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../create-context";

// Types
interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  subscription: string;
  createdAt: string;
  preferences: any;
  // Arrays are initialized empty
  resumes?: any[];
  jobs?: any[];
  applications?: any[];
  coverLetters?: any[];
  interviewSessions?: any[];
}

interface SessionData {
  id: string;
  userId: string;
  expiresAt: string;
}

// In-memory storage (replace with proper database when available)
const users = new Map<string, UserData>();
const userEmails = new Map<string, string>(); // email -> userId
const sessions = new Map<string, SessionData>();

// Helpers
function hashPassword(password: string): string {
  // In a real app, use bcrypt/argon2
  return Buffer.from(password).toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function createDefaultUser(id: string, email: string, name: string, passwordHash: string): UserData {
  return {
    id,
    email,
    passwordHash,
    name,
    subscription: "free",
    createdAt: new Date().toISOString(),
    resumes: [],
    jobs: [],
    applications: [],
    coverLetters: [],
    interviewSessions: [],
    preferences: {
      theme: "light",
      defaultTemplate: "modern",
      language: "en",
    },
  };
}

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Auth] Registering ${input.email}`);
      const emailRaw = sanitizeEmail(input.email);

      // 1. Check if email exists
      if (userEmails.has(emailRaw)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An account with this email already exists",
        });
      }

      // 2. Create User
      const userId = generateId("user");
      const user = createDefaultUser(userId, emailRaw, input.name, hashPassword(input.password));

      // 3. Save User & Mapping
      users.set(userId, user);
      userEmails.set(emailRaw, userId);

      // 4. Create Session
      const sessionToken = generateId("sess");
      const session: SessionData = {
        id: sessionToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      sessions.set(sessionToken, session);

      console.log(`[Auth] Registered successfully: ${userId}`);

      return {
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription: user.subscription,
          preferences: user.preferences,
        },
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Auth] Login attempt ${input.email}`);
      const emailRaw = sanitizeEmail(input.email);

      // 1. Find User ID
      const userId = userEmails.get(emailRaw);
      if (!userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No account found with this email address.",
        });
      }

      // 2. Get User
      const user = users.get(userId);
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User data not found despite email mapping existing.",
        });
      }

      // 3. Verify Password
      if (!verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Incorrect password.",
        });
      }

      // 4. Create Session
      const sessionToken = generateId("sess");
      const session: SessionData = {
        id: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      sessions.set(sessionToken, session);

      console.log(`[Auth] Login successful: ${user.id}`);

      return {
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription: user.subscription,
          preferences: user.preferences,
        },
      };
    }),

  googleAuth: publicProcedure
    .input(z.object({
      idToken: z.string(),
      email: z.string().email(),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Auth] Google Auth ${input.email}`);
      const emailRaw = sanitizeEmail(input.email);

      // 1. Find or Create User
      let userId = userEmails.get(emailRaw);
      let user: UserData | null = null;

      if (userId) {
        user = users.get(userId) || null;
      }

      if (!user) {
        userId = generateId("user");
        user = createDefaultUser(userId, emailRaw, input.name, "");
        
        users.set(userId, user);
        userEmails.set(emailRaw, userId);
      }

      // 2. Create Session
      const sessionToken = generateId("sess");
      const session: SessionData = {
        id: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      sessions.set(sessionToken, session);

      return {
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription: user.subscription,
          preferences: user.preferences,
        },
      };
    }),

  getUser: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .query(async ({ input }) => {
      const session = sessions.get(input.sessionToken);
      
      if (!session || new Date(session.expiresAt) < new Date()) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
      }

      const user = users.get(session.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        resumes: user.resumes || [],
        jobs: user.jobs || [],
        applications: user.applications || [],
        coverLetters: user.coverLetters || [],
        interviewSessions: user.interviewSessions || [],
        preferences: user.preferences,
      };
    }),

  logout: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .mutation(async ({ input }) => {
      sessions.delete(input.sessionToken);
      return { success: true };
    }),
});
