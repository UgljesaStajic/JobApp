export interface Resume {
  id: string;
  title: string;
  content: string;
  tags: string[];
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  url?: string;
  description: string;
  parsedKeywords: string[];
  mustHaveSkills: string[];
  niceToHave: string[];
  responsibilities: string[];
  matchScore: number;
  matchExplanation: string;
  createdAt: Date;
}

export interface Application {
  id: string;
  jobId: string;
  resumeId: string;
  coverLetterId?: string;
  status: "draft" | "applied" | "interview" | "offer" | "rejected";
  appliedAt?: Date;
  notes: string;
  createdAt: Date;
}

export interface CoverLetter {
  id: string;
  jobId: string;
  content: string;
  tone: "professional" | "friendly" | "confident" | "creative";
  length: "short" | "standard" | "long";
  createdAt: Date;
}

export interface InterviewSession {
  id: string;
  jobId?: string;
  question: string;
  recordingUri?: string;
  transcript: string;
  score: number;
  feedback: string;
  improvedAnswer: string;
  createdAt: Date;
}
