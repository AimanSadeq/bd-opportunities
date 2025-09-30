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
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  
  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Fix existing users that don't have profiles
-- This links any existing auth users to their profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  'consultant' as role,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Verification: Check that all auth users now have profiles
SELECT 
  COUNT(DISTINCT u.id) as total_auth_users,
  COUNT(DISTINCT p.id) as total_profiles,
  COUNT(DISTINCT u.id) = COUNT(DISTINCT p.id) as all_synced
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;