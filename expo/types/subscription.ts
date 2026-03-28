export type SubscriptionTier = "free" | "plus" | "pro";

export interface SubscriptionFeatures {
  resumeUploads: number;
  coverLetters: number;
  jobAnalyses: number;
  aiInterviewSimulator: boolean;
  cloudSync: boolean;
  premiumTemplates: boolean;
  exportWatermark: boolean;
  resumeHistory: boolean;
  linkedinOptimizer: boolean;
  chromeExtension: boolean;
  jobAggregator: boolean;
  prioritySupport: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    resumeUploads: 1,
    coverLetters: 1,
    jobAnalyses: 1,
    aiInterviewSimulator: false,
    cloudSync: false,
    premiumTemplates: false,
    exportWatermark: true,
    resumeHistory: false,
    linkedinOptimizer: false,
    chromeExtension: false,
    jobAggregator: false,
    prioritySupport: false,
  },
  plus: {
    resumeUploads: -1,
    coverLetters: -1,
    jobAnalyses: -1,
    aiInterviewSimulator: false,
    cloudSync: true,
    premiumTemplates: true,
    exportWatermark: false,
    resumeHistory: true,
    linkedinOptimizer: true,
    chromeExtension: false,
    jobAggregator: false,
    prioritySupport: false,
  },
  pro: {
    resumeUploads: -1,
    coverLetters: -1,
    jobAnalyses: -1,
    aiInterviewSimulator: true,
    cloudSync: true,
    premiumTemplates: true,
    exportWatermark: false,
    resumeHistory: true,
    linkedinOptimizer: true,
    chromeExtension: true,
    jobAggregator: true,
    prioritySupport: true,
  },
};

export const SUBSCRIPTION_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  plus: 9.99,
  pro: 19.99,
};
