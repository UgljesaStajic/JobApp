export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Education {
  degree: string;
  school: string;
  startDate: string;
  endDate: string;
}

export interface Resume {
  id: string;
  title: string;
  tags: string[];
  content: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JoobleJobData {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
  id: string;
  [key: string]: unknown;
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
  rawJobData?: JoobleJobData;
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
