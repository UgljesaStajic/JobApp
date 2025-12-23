import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import type { SubscriptionTier } from "@/types/subscription";
import type {
  Resume,
  Job,
  Application,
  CoverLetter,
  InterviewSession,
} from "@/types/models";



type ThemeType = "dark" | "light" | "space";

interface AppState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    subscription: SubscriptionTier;
  };
  preferences: {
    theme: ThemeType;
    defaultTemplate: string;
    defaultExportFormat: "pdf" | "docx";
    resumeAutoSave: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    language: string;
  };
  resumes: Resume[];
  jobs: Job[];
  applications: Application[];
  coverLetters: CoverLetter[];
  interviewSessions: InterviewSession[];
}

const STORAGE_KEY = "@jobpilot_state";

const defaultPreferences = {
  theme: "light" as ThemeType,
  defaultTemplate: "modern",
  defaultExportFormat: "pdf" as "pdf" | "docx",
  resumeAutoSave: true,
  emailNotifications: true,
  pushNotifications: true,
  language: "en",
};

const defaultState: AppState = {
  isAuthenticated: false,
  user: {
    name: "Alex Johnson",
    email: "alex@example.com",
    subscription: "free",
  },
  preferences: defaultPreferences,
  resumes: [],
  jobs: [],
  applications: [],
  coverLetters: [],
  interviewSessions: [],
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [state, setState] = useState<AppState>(defaultState);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const storedToken = await AsyncStorage.getItem("@session_token");
        
        if (stored) {
          const parsed = JSON.parse(stored);
          setState({
            ...parsed,
            preferences: {
              ...defaultPreferences,
              ...(parsed.preferences || {}),
            },
            resumes: parsed.resumes?.map((r: Resume) => ({
              ...r,
              createdAt: new Date(r.createdAt),
              updatedAt: new Date(r.updatedAt),
            })) || [],
            jobs: parsed.jobs?.map((j: Job) => ({
              ...j,
              createdAt: new Date(j.createdAt),
            })) || [],
            applications: parsed.applications?.map((a: Application) => ({
              ...a,
              createdAt: new Date(a.createdAt),
              appliedAt: a.appliedAt ? new Date(a.appliedAt) : undefined,
            })) || [],
            coverLetters: parsed.coverLetters?.map((c: CoverLetter) => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })) || [],
            interviewSessions: parsed.interviewSessions?.map((i: InterviewSession) => ({
              ...i,
              createdAt: new Date(i.createdAt),
            })) || [],
          });
        }
        
        if (storedToken) {
          setSessionToken(storedToken);
        }
      } catch (error) {
        console.error("Failed to load state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  const saveState = useCallback(async (newState: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }, []);

  const syncToDatabase = useCallback(async (updates: {
    resumes?: Resume[];
    jobs?: Job[];
    applications?: Application[];
    coverLetters?: CoverLetter[];
    interviewSessions?: InterviewSession[];
    preferences?: any;
    subscription?: SubscriptionTier;
    name?: string;
  }) => {
    if (!sessionToken || !state.isAuthenticated) {
      console.log("[AppContext] Not syncing: not authenticated");
      return;
    }

    try {
      console.log("[AppContext] Syncing to database...", Object.keys(updates));
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      if (!baseUrl) {
        console.warn("[AppContext] API URL not configured, skipping sync");
        return;
      }

      const input = {
        sessionToken,
        ...updates,
      };

      const response = await fetch(`${baseUrl}/api/trpc/auth.updateUserData?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { json: input } }))}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[AppContext] Sync failed:", text.substring(0, 200));
        return;
      }

      console.log("[AppContext] ✓ Synced to database");
    } catch (error) {
      console.error("[AppContext] Failed to sync to database:", error);
    }
  }, [sessionToken, state.isAuthenticated]);

  const login = useCallback(
    (user: { 
      name: string; 
      email: string; 
      subscription: SubscriptionTier; 
      preferences?: any;
      resumes?: Resume[];
      jobs?: Job[];
      applications?: Application[];
      coverLetters?: CoverLetter[];
      interviewSessions?: InterviewSession[];
    }, token?: string) => {
      console.log("User logged in:", user.email);
      if (token) {
        AsyncStorage.setItem("@session_token", token);
        setSessionToken(token);
      }
      const newState = {
        ...state,
        isAuthenticated: true,
        user: {
          name: user.name,
          email: user.email,
          subscription: user.subscription,
        },
        preferences: user.preferences ? { ...defaultPreferences, ...user.preferences } : state.preferences,
        resumes: user.resumes?.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        })) || [],
        jobs: user.jobs?.map((j: any) => ({
          ...j,
          createdAt: new Date(j.createdAt),
        })) || [],
        applications: user.applications?.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          appliedAt: a.appliedAt ? new Date(a.appliedAt) : undefined,
        })) || [],
        coverLetters: user.coverLetters?.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })) || [],
        interviewSessions: user.interviewSessions?.map((i: any) => ({
          ...i,
          createdAt: new Date(i.createdAt),
        })) || [],
      };
      saveState(newState);
    },
    [state, saveState]
  );

  const logout = useCallback(async () => {
    console.log("User logged out");
    await AsyncStorage.removeItem("@session_token");
    setSessionToken(null);
    const newState = {
      ...state,
      isAuthenticated: false,
      user: {
        name: "",
        email: "",
        subscription: "free" as SubscriptionTier,
      },
      resumes: [],
      jobs: [],
      applications: [],
      coverLetters: [],
      interviewSessions: [],
    };
    saveState(newState);
  }, [state, saveState]);

  const updateSubscription = useCallback(
    (tier: SubscriptionTier) => {
      console.log("Updating subscription to:", tier);
      const newState = {
        ...state,
        user: { ...state.user, subscription: tier },
      };
      saveState(newState);
      syncToDatabase({ subscription: tier });
    },
    [state, saveState, syncToDatabase]
  );

  const updatePreferences = useCallback(
    (updates: Partial<AppState["preferences"]>) => {
      console.log("Updating preferences:", updates);
      const newPreferences = { ...state.preferences, ...updates };
      const newState = {
        ...state,
        preferences: newPreferences,
      };
      saveState(newState);
      syncToDatabase({ preferences: newPreferences });
    },
    [state, saveState, syncToDatabase]
  );

  const updateUser = useCallback(
    (updates: Partial<AppState["user"]>) => {
      console.log("Updating user:", updates);
      const newState = {
        ...state,
        user: { ...state.user, ...updates },
      };
      saveState(newState);
      if (updates.name) {
        syncToDatabase({ name: updates.name });
      }
      if (updates.subscription) {
        syncToDatabase({ subscription: updates.subscription });
      }
    },
    [state, saveState, syncToDatabase]
  );

  const addResume = useCallback(
    (resume: Omit<Resume, "id" | "createdAt" | "updatedAt">) => {
      const newResume: Resume = {
        ...resume,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedResumes = [...state.resumes, newResume];
      const newState = {
        ...state,
        resumes: updatedResumes,
      };
      saveState(newState);
      syncToDatabase({ resumes: updatedResumes });
      return newResume;
    },
    [state, saveState, syncToDatabase]
  );

  const updateResume = useCallback(
    (id: string, updates: Partial<Resume>) => {
      const updatedResumes = state.resumes.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
      );
      const newState = {
        ...state,
        resumes: updatedResumes,
      };
      saveState(newState);
      syncToDatabase({ resumes: updatedResumes });
    },
    [state, saveState, syncToDatabase]
  );

  const deleteResume = useCallback(
    (id: string) => {
      const updatedResumes = state.resumes.filter((r) => r.id !== id);
      const newState = {
        ...state,
        resumes: updatedResumes,
      };
      saveState(newState);
      syncToDatabase({ resumes: updatedResumes });
    },
    [state, saveState, syncToDatabase]
  );

  const addJob = useCallback(
    (job: Omit<Job, "id" | "createdAt">) => {
      const newJob: Job = {
        ...job,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const updatedJobs = [...state.jobs, newJob];
      const newState = {
        ...state,
        jobs: updatedJobs,
      };
      saveState(newState);
      syncToDatabase({ jobs: updatedJobs });
      return newJob;
    },
    [state, saveState, syncToDatabase]
  );

  const deleteJob = useCallback(
    (id: string) => {
      const updatedJobs = state.jobs.filter((j) => j.id !== id);
      const newState = {
        ...state,
        jobs: updatedJobs,
      };
      saveState(newState);
      syncToDatabase({ jobs: updatedJobs });
    },
    [state, saveState, syncToDatabase]
  );

  const addApplication = useCallback(
    (application: Omit<Application, "id" | "createdAt">) => {
      const newApplication: Application = {
        ...application,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const updatedApplications = [...state.applications, newApplication];
      const newState = {
        ...state,
        applications: updatedApplications,
      };
      saveState(newState);
      syncToDatabase({ applications: updatedApplications });
      return newApplication;
    },
    [state, saveState, syncToDatabase]
  );

  const updateApplication = useCallback(
    (id: string, updates: Partial<Application>) => {
      const updatedApplications = state.applications.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      const newState = {
        ...state,
        applications: updatedApplications,
      };
      saveState(newState);
      syncToDatabase({ applications: updatedApplications });
    },
    [state, saveState, syncToDatabase]
  );

  const addCoverLetter = useCallback(
    (coverLetter: Omit<CoverLetter, "id" | "createdAt">) => {
      const newCoverLetter: CoverLetter = {
        ...coverLetter,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const updatedCoverLetters = [...state.coverLetters, newCoverLetter];
      const newState = {
        ...state,
        coverLetters: updatedCoverLetters,
      };
      saveState(newState);
      syncToDatabase({ coverLetters: updatedCoverLetters });
      return newCoverLetter;
    },
    [state, saveState, syncToDatabase]
  );

  const addInterviewSession = useCallback(
    (session: Omit<InterviewSession, "id" | "createdAt">) => {
      const newSession: InterviewSession = {
        ...session,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const updatedSessions = [...state.interviewSessions, newSession];
      const newState = {
        ...state,
        interviewSessions: updatedSessions,
      };
      saveState(newState);
      syncToDatabase({ interviewSessions: updatedSessions });
      return newSession;
    },
    [state, saveState, syncToDatabase]
  );

  return {
    state,
    isLoading,
    sessionToken,
    login,
    logout,
    updateSubscription,
    updatePreferences,
    updateUser,
    addResume,
    updateResume,
    deleteResume,
    addJob,
    deleteJob,
    addApplication,
    updateApplication,
    addCoverLetter,
    addInterviewSession,
  };
});
