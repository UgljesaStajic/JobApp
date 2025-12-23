-- Supabase Database Schema for JobPilot
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE public.users (
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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

-- Service role bypass (allows backend operations)
-- This policy allows service_role to bypass RLS completely
CREATE POLICY "Service role can manage all data" 
  ON public.users
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can only read their own data
CREATE POLICY "Users can view own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at);

-- Function to automatically create user record after signup
-- This function runs with SECURITY DEFINER which means it runs with the privileges of the function owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  INSERT INTO public.users (id, email, name, subscription, created_at, preferences, resumes, jobs, applications, cover_letters, interview_sessions)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'free',
    NOW(),
    '{"theme": "light", "defaultTemplate": "modern", "language": "en"}'::JSONB,
    '[]'::JSONB,
    '[]'::JSONB,
    '[]'::JSONB,
    '[]'::JSONB,
    '[]'::JSONB
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to call the function after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
