# Supabase Setup Instructions

## 1. Disable Email Confirmations

To allow users to sign up and log in immediately without email confirmation:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `vkqypbxpqdykjlvyvxnm`
3. Navigate to **Authentication** → **Providers** → **Email**
4. **Disable** the following options:
   - ✅ **Confirm email** - Turn this OFF
   - ✅ **Secure email change** - Turn this OFF (optional, but recommended for testing)
5. Click **Save**

## 2. Run the Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `backend/supabase-schema.sql`
5. Click **Run** or press `Ctrl+Enter`

This will create:
- The `users` table with proper structure
- Row Level Security (RLS) policies that allow users to access their own data
- A trigger function that automatically creates a user record when someone signs up
- Indexes for better performance

## 3. Verify the Setup

After running the schema, verify:

1. Go to **Database** → **Tables** in Supabase Dashboard
2. You should see a `users` table with columns:
   - id (UUID)
   - email (text)
   - name (text)
   - subscription (text)
   - created_at (timestamptz)
   - preferences (jsonb)
   - resumes (jsonb)
   - jobs (jsonb)
   - applications (jsonb)
   - cover_letters (jsonb)
   - interview_sessions (jsonb)

3. Go to **Database** → **Functions**
   - You should see `handle_new_user` function

4. Go to **Database** → **Triggers**
   - You should see `on_auth_user_created` trigger on `auth.users` table

## 4. Environment Variables Required

Make sure you have these environment variables set:

```env
EXPO_PUBLIC_SUPABASE_URL=https://vkqypbxpqdykjlvyvxnm.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_LCjgFhj2gUUuujy1Zucoyw_ii9_hsnD
SUPABASE_SERVICE_KEY=<your-service-role-key>
```

To find your Service Role Key:
1. Go to **Settings** → **API** in Supabase Dashboard
2. Under **Project API Keys**, copy the `service_role` key (NOT the anon/public key)
3. This key has full access to your database and bypasses RLS

## 5. Test the Authentication

1. Try signing up with a new account
2. You should be able to:
   - Create an account without email confirmation
   - Log in immediately after signup
   - Access the app right away

## Troubleshooting

### "Email confirmations required" error
- Make sure you disabled email confirmations in Authentication → Providers → Email

### "Row level security policy" errors
- Make sure you ran the SQL schema in the SQL Editor
- The trigger function needs SECURITY DEFINER to bypass RLS when creating users

### User record not created after signup
- Check the trigger is active: Database → Triggers
- Check function exists: Database → Functions
- Look at logs in Supabase Dashboard for any trigger errors

### Rate limiting errors
- Supabase has built-in rate limiting for security
- Wait the specified time before retrying
- The app now handles this gracefully and shows countdown timers

## How It Works

1. **User Signs Up**: `supabase.auth.signUp()` creates an entry in `auth.users`
2. **Trigger Fires**: The `on_auth_user_created` trigger automatically runs
3. **User Record Created**: The `handle_new_user()` function creates a record in the `users` table
4. **Session Created**: Supabase returns a session token immediately (no email confirmation needed)
5. **App Login**: The app stores the session token and user data for authenticated requests

The authentication is now fully automatic and works without any email confirmations!
