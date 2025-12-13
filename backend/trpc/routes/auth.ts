import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { db } from "@/backend/db";

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

function hashPassword(password: string): string {
  return Buffer.from(password).toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, "_");
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
      
      const emailKey = sanitizeEmail(input.email);
      const existingUser = await db.get<UserData>("users", emailKey);
      
      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An account with this email already exists",
        });
      }

      const userId = `user_${Date.now()}`;
      const user: UserData = {
        id: userId,
        email: input.email.toLowerCase(),
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

      await db.set("users", emailKey, user);

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
      
      const emailKey = sanitizeEmail(input.email);
      const user = await db.get<UserData>("users", emailKey);
      
      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No account found with this email address. Please register first.",
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
      
      const emailKey = sanitizeEmail(input.email);
      let user = await db.get<UserData>("users", emailKey);
      
      if (!user) {
        const userId = `user_${Date.now()}`;
        user = {
          id: userId,
          email: input.email.toLowerCase(),
          passwordHash: "",
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
        await db.set("users", emailKey, user);
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

      const users = await db.list<UserData>("users");
      const user = users.find(u => u.id === session.userId);
      
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

      const users = await db.list<UserData>("users");
      const user = users.find(u => u.id === session.userId);
      
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

      const emailKey = sanitizeEmail(user.email);
      await db.set("users", emailKey, user);

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

      const users = await db.list<UserData>("users");
      const user = users.find(u => u.id === session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!user.resumes) user.resumes = [];
      
      const existingIndex = user.resumes.findIndex(r => r.id === input.resume.id);
      if (existingIndex >= 0) {
        user.resumes[existingIndex] = input.resume;
      } else {
        user.resumes.push(input.resume);
      }

      const emailKey = sanitizeEmail(user.email);
      await db.set("users", emailKey, user);

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

      const users = await db.list<UserData>("users");
      const user = users.find(u => u.id === session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      user.resumes = (user.resumes || []).filter(r => r.id !== input.resumeId);
      
      const emailKey = sanitizeEmail(user.email);
      await db.set("users", emailKey, user);

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

      const users = await db.list<UserData>("users");
      const user = users.find(u => u.id === session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!user.jobs) user.jobs = [];

      const existingIndex = user.jobs.findIndex(j => j.id === input.job.id);
      if (existingIndex >= 0) {
        user.jobs[existingIndex] = input.job;
      } else {
        user.jobs.push(input.job);
      }

      const emailKey = sanitizeEmail(user.email);
      await db.set("users", emailKey, user);

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

      const users = await db.list<UserData>("users");
      const user = users.find(u => u.id === session.userId);
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      user.jobs = (user.jobs || []).filter(j => j.id !== input.jobId);
      
      const emailKey = sanitizeEmail(user.email);
      await db.set("users", emailKey, user);

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
