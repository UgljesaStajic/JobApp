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

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
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

  const login = useCallback(
    (user: { name: string; email: string; subscription: SubscriptionTier; preferences?: any }, sessionToken?: string) => {
      console.log("User logged in:", user.email);
      if (sessionToken) {
        AsyncStorage.setItem("@session_token", sessionToken);
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
      };
      saveState(newState);
    },
    [state, saveState]
  );

  const logout = useCallback(() => {
    console.log("User logged out");
    const newState = {
      ...state,
      isAuthenticated: false,
      user: {
        name: "",
        email: "",
        subscription: "free" as SubscriptionTier,
      },
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
    },
    [state, saveState]
  );

  const updatePreferences = useCallback(
    (updates: Partial<AppState["preferences"]>) => {
      console.log("Updating preferences:", updates);
      const newState = {
        ...state,
        preferences: { ...state.preferences, ...updates },
      };
      saveState(newState);
    },
    [state, saveState]
  );

  const updateUser = useCallback(
    (updates: Partial<AppState["user"]>) => {
      console.log("Updating user:", updates);
      const newState = {
        ...state,
        user: { ...state.user, ...updates },
      };
      saveState(newState);
    },
    [state, saveState]
  );

  const addResume = useCallback(
    (resume: Omit<Resume, "id" | "createdAt" | "updatedAt">) => {
      const newResume: Resume = {
        ...resume,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newState = {
        ...state,
        resumes: [...state.resumes, newResume],
      };
      saveState(newState);
      return newResume;
    },
    [state, saveState]
  );

  const updateResume = useCallback(
    (id: string, updates: Partial<Resume>) => {
      const newState = {
        ...state,
        resumes: state.resumes.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
        ),
      };
      saveState(newState);
    },
    [state, saveState]
  );

  const deleteResume = useCallback(
    (id: string) => {
      const newState = {
        ...state,
        resumes: state.resumes.filter((r) => r.id !== id),
      };
      saveState(newState);
    },
    [state, saveState]
  );

  const addJob = useCallback(
    (job: Omit<Job, "id" | "createdAt">) => {
      const newJob: Job = {
        ...job,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const newState = {
        ...state,
        jobs: [...state.jobs, newJob],
      };
      saveState(newState);
      return newJob;
    },
    [state, saveState]
  );

  const deleteJob = useCallback(
    (id: string) => {
      const newState = {
        ...state,
        jobs: state.jobs.filter((j) => j.id !== id),
      };
      saveState(newState);
    },
    [state, saveState]
  );

  const addApplication = useCallback(
    (application: Omit<Application, "id" | "createdAt">) => {
      const newApplication: Application = {
        ...application,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const newState = {
        ...state,
        applications: [...state.applications, newApplication],
      };
      saveState(newState);
      return newApplication;
    },
    [state, saveState]
  );

  const updateApplication = useCallback(
    (id: string, updates: Partial<Application>) => {
      const newState = {
        ...state,
        applications: state.applications.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      };
      saveState(newState);
    },
    [state, saveState]
  );

  const addCoverLetter = useCallback(
    (coverLetter: Omit<CoverLetter, "id" | "createdAt">) => {
      const newCoverLetter: CoverLetter = {
        ...coverLetter,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const newState = {
        ...state,
        coverLetters: [...state.coverLetters, newCoverLetter],
      };
      saveState(newState);
      return newCoverLetter;
    },
    [state, saveState]
  );

  const addInterviewSession = useCallback(
    (session: Omit<InterviewSession, "id" | "createdAt">) => {
      const newSession: InterviewSession = {
        ...session,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      const newState = {
        ...state,
        interviewSessions: [...state.interviewSessions, newSession],
      };
      saveState(newState);
      return newSession;
    },
    [state, saveState]
  );

  return {
    state,
    isLoading,
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
