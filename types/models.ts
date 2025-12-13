export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Resume {
  id: string;
  title: string;
  tags: string[];
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;

  parsedKeywords: string[];
  mustHaveSkills: string[];
  niceToHave: string[];
  responsibilities: string[];

  matchScore: number;
  matchExplanation: string;

  createdAt: Date;

  location?: string;
  url?: string;
}

export interface Application {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  notes?: string;
  createdAt: Date;
  appliedAt?: Date;
}

export type CoverLetterTone = 'professional' | 'friendly' | 'confident' | 'concise' | 'creative';
export type CoverLetterLength = 'short' | 'standard' | 'medium' | 'long';

export interface CoverLetter {
  id: string;
  jobId: string;
  content: string;
  tone: CoverLetterTone;
  length: CoverLetterLength;
  createdAt: Date;
}

export interface InterviewSession {
  id: string;
  jobId: string;
  question: string;
  recordingUri: string;
  transcript: string;
  score: number;
  feedback: string;
  improvedAnswer: string;
  createdAt: Date;
}
