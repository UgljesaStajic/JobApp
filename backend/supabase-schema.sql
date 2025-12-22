-- Supabase Database Schema for JobPilot
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subscription TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{"theme": "light", "defaultTemplate": "modern", "language": "en"}'::JSONB,
  resumes JSONB DEFAULT '[]'::JSONB,
  jobs JSONB DEFAULT '[]'::JSONB,
  applications JSONB DEFAULT '[]'::JSONB,
  cover_letters JSONB DEFAULT '[]'::JSONB,
  interview_sessions JSONB DEFAULT '[]'::JSONB
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Users can only read their own data
CREATE POLICY "Users can view own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Users can insert their own data
CREATE POLICY "Users can insert own data" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Users can delete their own data
CREATE POLICY "Users can delete own data" 
  ON users FOR DELETE 
  USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);

-- Function to automatically create user record after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
