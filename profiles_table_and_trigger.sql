-- SQL statements for creating the public.profiles table and an update trigger

-- 1. Create the public.profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT NULL,
  avatar_url TEXT NULL,
  role TEXT NOT NULL DEFAULT 'User'
);

-- Comment explaining the table structure and columns
COMMENT ON TABLE public.profiles IS 'Stores public profile information for users, linked to auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'Primary key, references auth.users.id.';
COMMENT ON COLUMN public.profiles.user_id IS 'Unique user identifier, references auth.users.id.';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp of when the profile was created.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of when the profile was last updated.';
COMMENT ON COLUMN public.profiles.full_name IS 'User''s full name.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL for the user''s avatar image.';
COMMENT ON COLUMN public.profiles.role IS 'User''s role, defaults to ''User''.';

-- 2. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the function
COMMENT ON FUNCTION public.handle_updated_at() IS 'Function to automatically update the updated_at timestamp on row modification.';

-- 3. Create a trigger to call the function when a row in profiles is updated
CREATE TRIGGER on_profiles_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Comment explaining the trigger
COMMENT ON TRIGGER on_profiles_update ON public.profiles IS 'Trigger to update the updated_at timestamp whenever a profile row is updated.';

-- Instructions for execution:
--
-- 1. Navigate to your Supabase project.
-- 2. Go to the "SQL Editor" section.
-- 3. Click on "+ New query".
-- 4. Copy and paste the entire content of this file into the editor.
-- 5. Click "RUN".
--
-- After successfully creating the table and trigger, it is highly recommended
-- to regenerate your Supabase TypeScript types to include the new table.
-- You can typically do this using the Supabase CLI command:
--
-- supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
--
-- Replace `<your-project-id>` with your actual Supabase project ID.
-- This command will update your local `src/types/supabase.ts` file (or your specified path)
-- with the schema definitions for your database, including the new `profiles` table.
-- This current task only covers the generation of the SQL.
