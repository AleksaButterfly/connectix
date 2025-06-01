-- =====================================================
-- COMPLETE PROFILES & AUDIT LOGS SCHEMA WITH POLICIES
-- =====================================================
-- This script will drop and recreate all profile and audit log related tables
-- with proper policies and triggers

-- =====================================================
-- STEP 1: DROP EXISTING POLICIES
-- =====================================================
-- Remove all existing policies to avoid conflicts

-- Drop profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Anyone can check usernames" ON public.profiles CASCADE;

-- Drop audit logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs CASCADE;
DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs CASCADE;

-- =====================================================
-- STEP 2: DROP EXISTING TRIGGERS
-- =====================================================
-- Remove triggers before dropping functions they depend on

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON public.audit_logs;

-- =====================================================
-- STEP 3: DROP EXISTING FUNCTIONS
-- =====================================================
-- Remove functions that are no longer needed

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- =====================================================
-- STEP 4: DROP EXISTING TABLES
-- =====================================================
-- Remove tables (CASCADE will drop dependent objects)

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- STEP 5: CREATE PROFILES TABLE
-- =====================================================
-- Store user profile information

CREATE TABLE public.profiles (
  -- Primary key linked to Supabase auth.users
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- User's email (synced from auth.users)
  email TEXT UNIQUE NOT NULL,
  
  -- Unique username for display
  username TEXT UNIQUE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Security features
  two_factor_enabled BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- =====================================================
-- STEP 6: CREATE AUDIT LOGS TABLE
-- =====================================================
-- Track all security-relevant actions for compliance

CREATE TABLE public.audit_logs (
  -- Auto-generated unique ID
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User who performed the action (NULL if user deleted)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- What action was performed
  action TEXT NOT NULL,
  
  -- Type of resource affected (e.g., 'organization', 'project', 'ssh_key')
  resource_type TEXT NOT NULL,
  
  -- ID of the affected resource
  resource_id TEXT,
  
  -- Network information
  ip_address INET,
  user_agent TEXT,
  
  -- When the action occurred
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- =====================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the updated_at column to current timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id, 
    NEW.email,
    -- Use username from metadata if provided, otherwise derive from email
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      split_part(NEW.email, '@', 1)
    )
  );
  
  -- Log the signup action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id)
  VALUES (
    NEW.id,
    'user.signup',
    'user',
    NEW.id::TEXT
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: CREATE TRIGGERS
-- =====================================================

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update the updated_at timestamp on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- =====================================================
-- Ensure data access is properly controlled

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 10: CREATE SECURITY POLICIES
-- =====================================================

-- PROFILES POLICIES

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow checking if username exists (for registration)
-- This is needed for username availability checks
CREATE POLICY "Anyone can check usernames" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- AUDIT LOGS POLICIES

-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Authenticated users can create audit logs for their actions
CREATE POLICY "Users can create audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 11: GRANT PERMISSIONS
-- =====================================================
-- Ensure authenticated users have necessary permissions

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

-- Grant usage on sequences (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- STEP 12: CREATE USEFUL VIEWS (OPTIONAL)
-- =====================================================

-- View for user activity summary (optional, uncomment to use)
-- CREATE VIEW public.user_activity_summary AS
-- SELECT 
--   user_id,
--   COUNT(*) as total_actions,
--   MAX(created_at) as last_activity,
--   array_agg(DISTINCT resource_type) as resource_types
-- FROM public.audit_logs
-- GROUP BY user_id;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify everything was created correctly

-- Check if tables were created
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('profiles', 'audit_logs');

-- Check if policies were created
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('profiles', 'audit_logs');

-- Check if triggers were created
-- SELECT trigger_name, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public';

-- Test profile creation (will only work if you're authenticated)
-- SELECT * FROM public.profiles WHERE id = auth.uid();

-- =====================================================
-- COMMON OPERATIONS (EXAMPLES)
-- =====================================================

-- Example: Update user's 2FA status
-- UPDATE public.profiles 
-- SET two_factor_enabled = true 
-- WHERE id = auth.uid();

-- Example: Log a security action
-- INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id)
-- VALUES (auth.uid(), 'ssh_key.created', 'ssh_key', 'key_123');

-- Example: View recent audit logs
-- SELECT * FROM public.audit_logs 
-- WHERE user_id = auth.uid() 
-- ORDER BY created_at DESC 
-- LIMIT 50;