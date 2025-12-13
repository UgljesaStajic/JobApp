import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { db } from "@/backend/db";

// Redefining interfaces locally to ensure they match exact usage here if not strictly shared
// But good practice is to use shared types. I'll define them here for safety and self-containment as per previous file.

interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  subscription: string;
  createdAt: string;
  resumes: any[];
  jobs: any[];
  applications: any[];
  coverLetters: any[];
  interviewSessions: any[];
  preferences: any;
}

interface SessionData {
  id: string;
  userId: string;
  expiresAt: string;
}

interface EmailMapping {
  id: string;
  userId: string;
}

function hashPassword(password: string): string {
  // Simple base64 for demo purposes as seen in previous code. 
  // In production, use bcrypt/argon2.
  return Buffer.from(password).toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      console.log("Register attempt:", input.email);
      
      const emailRaw = sanitizeEmail(input.email);
      
      // 1. Check if email exists using direct lookup
      const existingMapping = await db.get<EmailMapping>("user_emails", emailRaw);
      
      if (existingMapping) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An account with this email already exists",
        });
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const user: UserData = {
        id: userId,
        email: emailRaw,
        passwordHash: hashPassword(input.password),
        name: input.name,
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
          defaultExportFormat: "pdf",
          resumeAutoSave: true,
          emailNotifications: true,
          pushNotifications: true,
          language: "en",
        },
      };

      // 2. Save user data
      await db.set("users", userId, user);
      
      // 3. Save email mapping
      await db.set("user_emails", emailRaw, { id: emailRaw, userId });

      // 4. Create session
      const sessionToken = generateSessionToken();
      const session: SessionData = {
        id: sessionToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      await db.set("sessions", sessionToken, session);

      console.log("User registered successfully:", input.email);

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
      console.log("Login attempt:", input.email);
      
      const emailRaw = sanitizeEmail(input.email);
      
      // 1. Lookup userId from email
      let mapping = await db.get<EmailMapping>("user_emails", emailRaw);
      let userId = mapping?.userId;
      
      // Fallback: If no mapping, try to find in existing users list (migration for old accounts)
      if (!userId) {
        console.log("No email mapping found, scanning users list (fallback)...");
        const users = await db.list<UserData>("users");
        const foundUser = users.find(u => u.email?.toLowerCase() === emailRaw);
        
        if (foundUser) {
           userId = foundUser.id;
           // Create the mapping for next time so login is fast
           await db.set("user_emails", emailRaw, { id: emailRaw, userId });
           console.log("Recovered user from list scan:", emailRaw);
        }
      }
      
      if (!userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No account found with this email address. Please register first.",
        });
      }

      // 2. Fetch user data
      const user = await db.get<UserData>("users", userId);
      
      if (!user) {
         // Should not happen if data is consistent, but handle it
         throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User data corrupted or missing",
        });
      }

      if (!verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Incorrect password. Please try again.",
        });
      }

      const sessionToken = generateSessionToken();
      const session: SessionData = {
        id: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      await db.set("sessions", sessionToken, session);

      console.log("Login successful:", input.email);

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
      console.log("Google auth:", input.email);
      
      const emailRaw = sanitizeEmail(input.email);
      
      // Check if user exists
      const mapping = await db.get<EmailMapping>("user_emails", emailRaw);
      let userId = mapping?.userId;
      let user: UserData | null = null;

      if (userId) {
        user = await db.get<UserData>("users", userId);
      }

      if (!user) {
        // Create new user
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        user = {
          id: userId,
          email: emailRaw,
          passwordHash: "", // No password for google auth
          name: input.name,
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
            defaultExportFormat: "pdf",
            resumeAutoSave: true,
            emailNotifications: true,
            pushNotifications: true,
            language: "en",
          },
        };
        
        await db.set("users", userId, user);
        await db.set("user_emails", emailRaw, { id: emailRaw, userId });
      }

      const sessionToken = generateSessionToken();
      const session: SessionData = {
        id: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      await db.set("sessions", sessionToken, session);

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
      const session = await db.get<SessionData>("sessions", input.sessionToken);
      
      if (!session || new Date(session.expiresAt) < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      // Direct lookup by ID - MUCH faster/reliable than listing all users
      const user = await db.get<UserData>("users", session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
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

  updateUser: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      updates: z.object({
        name: z.string().optional(),
        preferences: z.any().optional(),
        subscription: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const session = await db.get<SessionData>("sessions", input.sessionToken);
      
      if (!session || new Date(session.expiresAt) < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const user = await db.get<UserData>("users", session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (input.updates.name) user.name = input.updates.name;
      if (input.updates.preferences) {
        user.preferences = { ...user.preferences, ...input.updates.preferences };
      }
      if (input.updates.subscription) user.subscription = input.updates.subscription;

      await db.set("users", user.id, user);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        preferences: user.preferences,
      };
    }),

  saveResume: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      resume: z.any(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.get<SessionData>("sessions", input.sessionToken);
      
      if (!session || new Date(session.expiresAt) < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const user = await db.get<UserData>("users", session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!user.resumes) user.resumes = [];
      
      const existingIndex = user.resumes.findIndex((r: any) => r.id === input.resume.id);
      if (existingIndex >= 0) {
        user.resumes[existingIndex] = input.resume;
      } else {
        user.resumes.push(input.resume);
      }

      await db.set("users", user.id, user);

      return { success: true };
    }),

  deleteResume: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      resumeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.get<SessionData>("sessions", input.sessionToken);
      
      if (!session || new Date(session.expiresAt) < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const user = await db.get<UserData>("users", session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      user.resumes = (user.resumes || []).filter((r: any) => r.id !== input.resumeId);
      
      await db.set("users", user.id, user);

      return { success: true };
    }),

  saveJob: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      job: z.any(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.get<SessionData>("sessions", input.sessionToken);
      
      if (!session || new Date(session.expiresAt) < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const user = await db.get<UserData>("users", session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!user.jobs) user.jobs = [];

      const existingIndex = user.jobs.findIndex((j: any) => j.id === input.job.id);
      if (existingIndex >= 0) {
        user.jobs[existingIndex] = input.job;
      } else {
        user.jobs.push(input.job);
      }

      await db.set("users", user.id, user);

      return { success: true };
    }),

  deleteJob: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      jobId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.get<SessionData>("sessions", input.sessionToken);
      
      if (!session || new Date(session.expiresAt) < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired session",
        });
      }

      const user = await db.get<UserData>("users", session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      user.jobs = (user.jobs || []).filter((j: any) => j.id !== input.jobId);
      
      await db.set("users", user.id, user);

      return { success: true };
    }),

  logout: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.delete("sessions", input.sessionToken);
      return { success: true };
    }),
});
