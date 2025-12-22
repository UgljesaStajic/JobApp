# Supabase Setup Instructions

## Overview
Your app now uses Supabase for authentication and database. Follow these steps to complete the setup.

## Step 1: Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `backend/supabase-schema.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the schema

This will create:
- `users` table with all necessary columns
- Row Level Security (RLS) policies to protect user data
- Automatic user creation trigger
- Indexes for better performance

## Step 2: Configure Authentication

1. In Supabase dashboard, go to **Authentication** > **Settings**
2. Under **Auth Providers**, ensure **Email** is enabled
3. Optional: Configure email templates under **Email Templates**
4. Optional: Disable email confirmation if you want immediate access (for development)
   - Go to **Authentication** > **Settings** > **Email Auth**
   - Toggle off "Confirm email"

## Step 3: Verify Environment Variables

Your environment variables are already configured:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_KEY`: Your publishable/anon API key

## Step 4: Test Authentication

1. Start your backend server (if not already running)
2. Open your app
3. Try creating a new account with email and password
4. After signup, you should be logged in automatically
5. Test logout and login again

## Security Notes

- Row Level Security (RLS) is enabled - users can only access their own data
- The publishable key is safe to use in client-side code
- Never share your service role key or secret key
- All user data is isolated by their auth.uid()

## Troubleshooting

### "Failed to create account"
- Check Supabase logs in Dashboard > Logs
- Verify email provider is enabled
- Check if email confirmation is required

### "Session expired"
- The access token may have expired
- User needs to log in again
- Sessions last 1 hour by default (configurable in Supabase)

### "User not found in database"
- Verify the trigger `on_auth_user_created` is active
- Check the `users` table in Table Editor
- Manually run the schema if needed

## Database Structure

The `users` table stores:
- Basic info: id, email, name, subscription
- Preferences: theme, templates, language
- User data: resumes, jobs, applications, coverLetters, interviewSessions

All user-specific data is stored as JSONB arrays for flexibility.
