import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const users = new Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  subscription: string;
  createdAt: Date;
  resumes: any[];
  jobs: any[];
  applications: any[];
  coverLetters: any[];
  interviewSessions: any[];
  preferences: any;
}>();

const sessions = new Map<string, { userId: string; expiresAt: Date }>();

function hashPassword(password: string): string {
  return Buffer.from(password).toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
    }))
    .mutation(({ input }) => {
      console.log("Register attempt:", input.email);
      
      if (users.has(input.email)) {
        throw new Error("User already exists");
      }

      const userId = `user_${Date.now()}`;
      const user = {
        id: userId,
        email: input.email,
        passwordHash: hashPassword(input.password),
        name: input.name,
        subscription: "free",
        createdAt: new Date(),
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

      users.set(input.email, user);

      const sessionToken = generateSessionToken();
      sessions.set(sessionToken, {
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

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
    .mutation(({ input }) => {
      console.log("Login attempt:", input.email);
      
      const user = users.get(input.email);
      if (!user) {
        throw new Error("Invalid email or password");
      }

      if (!verifyPassword(input.password, user.passwordHash)) {
        throw new Error("Invalid email or password");
      }

      const sessionToken = generateSessionToken();
      sessions.set(sessionToken, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

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
    .mutation(({ input }) => {
      console.log("Google auth:", input.email);
      
      let user = users.get(input.email);
      
      if (!user) {
        const userId = `user_${Date.now()}`;
        user = {
          id: userId,
          email: input.email,
          passwordHash: "",
          name: input.name,
          subscription: "free",
          createdAt: new Date(),
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
        users.set(input.email, user);
      }

      const sessionToken = generateSessionToken();
      sessions.set(sessionToken, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

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
    .query(({ input }) => {
      const session = sessions.get(input.sessionToken);
      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid or expired session");
      }

      const user = Array.from(users.values()).find(u => u.id === session.userId);
      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        resumes: user.resumes,
        jobs: user.jobs,
        applications: user.applications,
        coverLetters: user.coverLetters,
        interviewSessions: user.interviewSessions,
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
    .mutation(({ input }) => {
      const session = sessions.get(input.sessionToken);
      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid or expired session");
      }

      const user = Array.from(users.values()).find(u => u.id === session.userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (input.updates.name) user.name = input.updates.name;
      if (input.updates.preferences) {
        user.preferences = { ...user.preferences, ...input.updates.preferences };
      }
      if (input.updates.subscription) user.subscription = input.updates.subscription;

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
    .mutation(({ input }) => {
      const session = sessions.get(input.sessionToken);
      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid or expired session");
      }

      const user = Array.from(users.values()).find(u => u.id === session.userId);
      if (!user) {
        throw new Error("User not found");
      }

      const existingIndex = user.resumes.findIndex(r => r.id === input.resume.id);
      if (existingIndex >= 0) {
        user.resumes[existingIndex] = input.resume;
      } else {
        user.resumes.push(input.resume);
      }

      return { success: true };
    }),

  deleteResume: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      resumeId: z.string(),
    }))
    .mutation(({ input }) => {
      const session = sessions.get(input.sessionToken);
      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid or expired session");
      }

      const user = Array.from(users.values()).find(u => u.id === session.userId);
      if (!user) {
        throw new Error("User not found");
      }

      user.resumes = user.resumes.filter(r => r.id !== input.resumeId);
      return { success: true };
    }),

  saveJob: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      job: z.any(),
    }))
    .mutation(({ input }) => {
      const session = sessions.get(input.sessionToken);
      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid or expired session");
      }

      const user = Array.from(users.values()).find(u => u.id === session.userId);
      if (!user) {
        throw new Error("User not found");
      }

      const existingIndex = user.jobs.findIndex(j => j.id === input.job.id);
      if (existingIndex >= 0) {
        user.jobs[existingIndex] = input.job;
      } else {
        user.jobs.push(input.job);
      }

      return { success: true };
    }),

  deleteJob: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      jobId: z.string(),
    }))
    .mutation(({ input }) => {
      const session = sessions.get(input.sessionToken);
      if (!session || session.expiresAt < new Date()) {
        throw new Error("Invalid or expired session");
      }

      const user = Array.from(users.values()).find(u => u.id === session.userId);
      if (!user) {
        throw new Error("User not found");
      }

      user.jobs = user.jobs.filter(j => j.id !== input.jobId);
      return { success: true };
    }),

  logout: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
    }))
    .mutation(({ input }) => {
      sessions.delete(input.sessionToken);
      return { success: true };
    }),
});
