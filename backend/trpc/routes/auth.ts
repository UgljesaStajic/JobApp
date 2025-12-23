import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { db, supabase } from "@/backend/db";

interface UserData {
  id: string;
  email: string;
  name: string;
  subscription: string;
  createdAt: string;
  preferences: any;
  resumes?: any[];
  jobs?: any[];
  applications?: any[];
  coverLetters?: any[];
  interviewSessions?: any[];
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function createDefaultUser(id: string, email: string, name: string): UserData {
  return {
    id,
    email,
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

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailRaw,
        password: input.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: input.name,
          },
        },
      });

      if (authError) {
        console.error("[Auth] Supabase signup error:", authError);
        
        if (authError.message?.toLowerCase().includes('already registered') || 
            authError.message?.toLowerCase().includes('already exists') ||
            authError.message?.toLowerCase().includes('user already')) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This email is already registered. Please log in instead.",
          });
        }
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: authError.message || "Failed to create account",
        });
      }

      if (!authData.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user account",
        });
      }

      const userId = authData.user.id;
      console.log(`[Auth] User created with ID: ${userId}`);
      
      console.log(`[Auth] Waiting for trigger to create user record...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let user = await db.get<UserData>("users", userId, true);
      let retries = 0;
      while (!user && retries < 8) {
        console.log(`[Auth] Waiting for user record (attempt ${retries + 1}/8)...`);
        await new Promise(resolve => setTimeout(resolve, 600));
        user = await db.get<UserData>("users", userId, true);
        retries++;
      }
      
      if (!user) {
        console.error(`[Auth] Trigger failed, creating user record manually...`);
        user = createDefaultUser(userId, emailRaw, input.name);
        try {
          await db.set("users", userId, user, true);
          console.log(`[Auth] Successfully created user record manually`);
        } catch (dbError: any) {
          console.error(`[Auth] Failed to create user record:`, dbError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user profile. Please try again.",
          });
        }
      } else {
        console.log(`[Auth] User record created successfully by trigger`);
      }

      console.log(`[Auth] Registration complete: ${userId}`);

      if (!authData.session) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No session created. Please check Supabase email confirmation settings.",
        });
      }

      return {
        sessionToken: authData.session.access_token,
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

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailRaw,
        password: input.password,
      });

      if (authError) {
        console.error("[Auth] Supabase login error:", authError);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: authError.message || "Login failed",
        });
      }

      if (!authData.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User data not found",
        });
      }

      const userId = authData.user.id;
      let user = await db.get<UserData>("users", userId, true);

      if (!user) {
        console.log(`[Auth] User record not found, creating...`);
        const name = authData.user.user_metadata?.name || emailRaw.split("@")[0];
        user = createDefaultUser(userId, emailRaw, name);
        await db.set("users", userId, user, true);
      }

      console.log(`[Auth] Login successful: ${user.id}`);

      return {
        sessionToken: authData.session?.access_token || "",
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

      const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: input.idToken,
      });

      if (authError) {
        console.error("[Auth] Google auth error:", authError);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: authError.message || "Google authentication failed",
        });
      }

      if (!authData.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to authenticate with Google",
        });
      }

      const userId = authData.user.id;
      let user = await db.get<UserData>("users", userId, true);

      if (!user) {
        user = createDefaultUser(userId, emailRaw, input.name);
        await db.set("users", userId, user, true);
      }

      return {
        sessionToken: authData.session?.access_token || "",
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
      const { data: userData, error: authError } = await supabase.auth.getUser(input.sessionToken);
      
      if (authError || !userData.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
      }

      const user = await db.get<UserData>("users", userData.user.id, true);
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
      await supabase.auth.signOut();
      return { success: true };
    }),
});
