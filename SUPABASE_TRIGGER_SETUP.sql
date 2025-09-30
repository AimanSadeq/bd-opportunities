-- ============================================
-- SUPABASE DATABASE TRIGGER SETUP
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- This trigger automatically creates a profile when a user signs up
-- It ensures auth accounts and profiles are always in sync

-- Step 1: Create the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'consultant',
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Create profiles for existing auth users that don't have one
-- This links any orphaned auth accounts
INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  CASE 
    -- Preserve admin role for asadeq@viftraining.com
    WHEN u.email = 'asadeq@viftraining.com' THEN 'admin'
    ELSE 'consultant'
  END as role,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Fix orphaned profiles by email matching
-- For profiles that exist with wrong IDs, we need to handle them carefully
-- Delete orphaned profiles that don't match any auth user by ID
DELETE FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
)
AND EXISTS (
  SELECT 1 FROM auth.users u WHERE u.email = p.email
);

-- Step 5: Now insert the correct profiles for those users
INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  CASE 
    WHEN u.email = 'asadeq@viftraining.com' THEN 'admin'
    ELSE 'consultant'
  END as role,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Verification - Check synchronization status
SELECT 
  'Auth users' as type,
  COUNT(*) as count,
  string_agg(email, ', ') as emails
FROM auth.users
UNION ALL
SELECT 
  'Profiles' as type,
  COUNT(*) as count,
  string_agg(email, ', ') as emails
FROM public.profiles
UNION ALL
SELECT 
  'Correctly linked' as type,
  COUNT(*) as count,
  string_agg(u.email, ', ') as emails
FROM auth.users u
JOIN public.profiles p ON u.id = p.id AND u.email = p.email;