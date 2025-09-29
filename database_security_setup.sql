-- VIFM Portal Database Security Setup
-- CRITICAL: This script MUST be run in Supabase Dashboard → SQL Editor
-- These server-side protections are essential for production security

-- =====================================================
-- 1. ROLE CONSTRAINTS & VALIDATION
-- =====================================================

-- Add CHECK constraint to prevent invalid roles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('consultant', 'bd', 'admin'));

-- Add default role constraint
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'consultant';

-- =====================================================
-- 2. AUTOMATIC PROFILE CREATION TRIGGER
-- =====================================================

-- Function to automatically create profiles when auth users are created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'consultant' -- Always default to consultant role for security
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 3. STRICT RLS POLICIES (SECURITY CRITICAL)
-- =====================================================

-- Drop ALL existing policies to ensure clean setup
DROP POLICY IF EXISTS "Enable all operations for bd_opportunities" ON bd_opportunities;
DROP POLICY IF EXISTS "Public access for opportunities" ON opportunities;
DROP POLICY IF EXISTS "Authenticated users can access opportunities" ON opportunities;
DROP POLICY IF EXISTS "Authenticated users can access bd_opportunities" ON bd_opportunities;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

-- Drop our own policies if they exist (for re-running script)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile only" ON profiles;
DROP POLICY IF EXISTS "Prevent role elevation" ON profiles;
DROP POLICY IF EXISTS "System can create profiles" ON profiles;

DROP POLICY IF EXISTS "opportunities_select" ON opportunities;
DROP POLICY IF EXISTS "opportunities_insert" ON opportunities;
DROP POLICY IF EXISTS "opportunities_update" ON opportunities;
DROP POLICY IF EXISTS "opportunities_delete" ON opportunities;
DROP POLICY IF EXISTS "Users manage their opportunities only" ON opportunities;

DROP POLICY IF EXISTS "bd_opportunities_select" ON bd_opportunities;
DROP POLICY IF EXISTS "bd_opportunities_insert" ON bd_opportunities;
DROP POLICY IF EXISTS "bd_opportunities_update" ON bd_opportunities;
DROP POLICY IF EXISTS "bd_opportunities_delete" ON bd_opportunities;
DROP POLICY IF EXISTS "Users manage their bd_opportunities only" ON bd_opportunities;

-- Secure profile policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- CRITICAL: Secure UPDATE policy with WITH CHECK to prevent role elevation
CREATE POLICY "profiles_update_own" ON profiles  
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id AND role IN ('consultant', 'bd'));

-- Admin override policy (allows admins to update any profile)
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (role IN ('consultant', 'bd', 'admin'));

-- Profile creation policy (for trigger and emergency manual creation)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id AND 
    role IN ('consultant', 'bd')
  );

-- Secure opportunities policies
CREATE POLICY "opportunities_select" ON opportunities
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = created_by::text
  );

CREATE POLICY "opportunities_insert" ON opportunities
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = created_by::text
  );

CREATE POLICY "opportunities_update" ON opportunities
  FOR UPDATE 
  USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = created_by::text
  )
  WITH CHECK (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = created_by::text
  );

CREATE POLICY "opportunities_delete" ON opportunities
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = created_by::text
  );

-- Secure bd_opportunities policies  
CREATE POLICY "bd_opportunities_select" ON bd_opportunities
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = assigned_to::text
  );

CREATE POLICY "bd_opportunities_insert" ON bd_opportunities
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = assigned_to::text
  );

CREATE POLICY "bd_opportunities_update" ON bd_opportunities
  FOR UPDATE 
  USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = assigned_to::text
  )
  WITH CHECK (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = assigned_to::text
  );

CREATE POLICY "bd_opportunities_delete" ON bd_opportunities
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = assigned_to::text
  );

-- =====================================================
-- 4. ADMIN ROLE PROTECTION
-- =====================================================

-- Function to safely promote users to admin (must be called by existing admin)
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can promote users to admin role';
  END IF;
  
  -- Update target user role
  UPDATE profiles 
  SET role = 'admin' 
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify role constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' AND constraint_type = 'CHECK';

-- Verify triggers
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'opportunities', 'bd_opportunities')
ORDER BY tablename, policyname;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- After running this script:
-- 1. All new user registrations will automatically get profiles
-- 2. Users cannot self-assign admin roles
-- 3. Profile access is restricted to owners only
-- 4. Role elevation requires explicit admin action via promote_to_admin()
-- 5. Database-level constraints prevent privilege escalation