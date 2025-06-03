-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR CONNECTIX
-- =====================================================
-- This script creates the complete database structure including:
-- - User profiles and audit logs
-- - Organizations with ID-based routing
-- - Organization members and projects
-- - All necessary functions, triggers, and RLS policies
-- 
-- Run this script to recreate the entire database from scratch
-- =====================================================

-- =====================================================
-- SECTION 1: CLEANUP - DROP EXISTING OBJECTS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Anyone can check usernames" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs CASCADE;
DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs CASCADE;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Owners can delete their organizations" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Owners can add members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Owners can update members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Owners can remove members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Members can view organization projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Admins can create projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects CASCADE;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON public.audit_logs;
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.create_organization_with_owner() CASCADE;
DROP FUNCTION IF EXISTS public.generate_slug(input_text TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_organization_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_organization_owner(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_organization_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_project_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_organizations() CASCADE;
DROP FUNCTION IF EXISTS public.get_organization_projects(UUID) CASCADE;

-- Drop existing tables
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- SECTION 2: CREATE PROFILES AND AUDIT LOGS
-- =====================================================

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  two_factor_enabled BOOLEAN DEFAULT FALSE
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- =====================================================
-- SECTION 3: CREATE ORGANIZATIONS AND RELATED TABLES
-- =====================================================

-- Create organizations table (slug is NOT UNIQUE for ID-based routing)
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization members table
CREATE TABLE public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Create indexes for organizations
CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_name ON public.organizations(name);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_role ON public.organization_members(role);
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);

-- =====================================================
-- SECTION 4: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
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

-- Function to generate URL-friendly slug
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(input_text),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to add creator as owner member
CREATE OR REPLACE FUNCTION public.create_organization_with_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the organization creator as an owner member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id)
  VALUES (NEW.owner_id, 'organization.created', 'organization', NEW.id::TEXT);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization membership (with fix for ambiguity)
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = org_id 
    AND om.user_id = check_user_id
  ) INTO is_member;
  
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization ownership
CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.organizations 
    WHERE id = org_id 
    AND owner_id = check_user_id
  ) INTO is_owner;
  
  RETURN is_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or owner (with fix for ambiguity)
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members om
    WHERE om.organization_id = org_id 
    AND om.user_id = check_user_id
    AND om.role IN ('owner', 'admin')
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access a project
CREATE OR REPLACE FUNCTION public.is_project_member(project_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org_id UUID;
  is_member BOOLEAN;
BEGIN
  -- Get the organization ID for this project
  SELECT organization_id INTO org_id
  FROM public.projects
  WHERE id = project_id;
  
  -- Check if user is a member of the organization
  IF org_id IS NOT NULL THEN
    RETURN public.is_organization_member(org_id, check_user_id);
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organizations with member count and project count
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  members_count BIGINT,
  projects_count BIGINT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.owner_id,
    o.created_at,
    o.updated_at,
    COUNT(DISTINCT om.user_id) as members_count,
    COUNT(DISTINCT p.id) as projects_count,
    MAX(CASE 
      WHEN o.owner_id = auth.uid() THEN 'owner'
      ELSE om2.role 
    END) as user_role
  FROM public.organizations o
  LEFT JOIN public.organization_members om ON om.organization_id = o.id
  LEFT JOIN public.projects p ON p.organization_id = o.id
  LEFT JOIN public.organization_members om2 ON om2.organization_id = o.id AND om2.user_id = auth.uid()
  WHERE o.owner_id = auth.uid() OR om2.user_id = auth.uid()
  GROUP BY o.id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization's projects
CREATE OR REPLACE FUNCTION public.get_organization_projects(org_id UUID)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by_username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.organization_id,
    p.name,
    p.slug,
    p.description,
    p.created_by,
    p.created_at,
    p.updated_at,
    pr.username as created_by_username
  FROM public.projects p
  LEFT JOIN public.profiles pr ON pr.id = p.created_by
  WHERE p.organization_id = org_id
    AND public.is_organization_member(org_id, auth.uid())
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 5: CREATE TRIGGERS
-- =====================================================

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers to update the updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to add creator as owner when organization is created
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_organization_with_owner();

-- =====================================================
-- SECTION 6: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 7: CREATE RLS POLICIES
-- =====================================================

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Anyone can check usernames" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- AUDIT LOGS POLICIES
CREATE POLICY "Users can view own audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ORGANIZATIONS POLICIES
CREATE POLICY "Users can view their organizations" 
  ON public.organizations 
  FOR SELECT 
  USING (
    owner_id = auth.uid() 
    OR 
    public.is_organization_member(id, auth.uid())
  );

CREATE POLICY "Users can create organizations" 
  ON public.organizations 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id
  );

CREATE POLICY "Owners can update their organizations" 
  ON public.organizations 
  FOR UPDATE 
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their organizations" 
  ON public.organizations 
  FOR DELETE 
  USING (owner_id = auth.uid());

-- ORGANIZATION MEMBERS POLICIES
CREATE POLICY "Members can view organization members" 
  ON public.organization_members 
  FOR SELECT 
  USING (
    public.is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "Owners can add members" 
  ON public.organization_members 
  FOR INSERT 
  WITH CHECK (
    public.is_organization_owner(organization_id, auth.uid())
  );

CREATE POLICY "Owners can update members" 
  ON public.organization_members 
  FOR UPDATE 
  USING (
    public.is_organization_owner(organization_id, auth.uid())
  );

CREATE POLICY "Owners can remove members" 
  ON public.organization_members 
  FOR DELETE 
  USING (
    public.is_organization_owner(organization_id, auth.uid())
  );

-- PROJECTS POLICIES
CREATE POLICY "Members can view organization projects" 
  ON public.projects 
  FOR SELECT 
  USING (
    public.is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "Admins can create projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (
    public.is_organization_admin(organization_id, auth.uid())
    AND auth.uid() = created_by
  );

CREATE POLICY "Admins can update projects" 
  ON public.projects 
  FOR UPDATE 
  USING (
    public.is_organization_admin(organization_id, auth.uid())
  );

CREATE POLICY "Admins can delete projects" 
  ON public.projects 
  FOR DELETE 
  USING (
    public.is_organization_admin(organization_id, auth.uid())
  );

-- =====================================================
-- SECTION 8: GRANT PERMISSIONS
-- =====================================================

-- Grant table permissions to authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organization_members TO authenticated;
GRANT ALL ON public.projects TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_projects(UUID) TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SECTION 9: VERIFICATION QUERIES (Optional)
-- =====================================================

-- Uncomment these queries to verify the setup

-- Check all tables were created
-- SELECT table_name, 
--        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
-- FROM information_schema.tables t
-- WHERE t.table_schema = 'public' 
-- AND t.table_name IN ('profiles', 'audit_logs', 'organizations', 'organization_members', 'projects')
-- ORDER BY t.table_name;

-- Check all policies were created
-- SELECT tablename, policyname, permissive, cmd
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('profiles', 'audit_logs', 'organizations', 'organization_members', 'projects');

-- =====================================================
-- SECTION 10: SAMPLE OPERATIONS (Examples)
-- =====================================================

-- Create an organization
-- INSERT INTO organizations (name, slug, owner_id) 
-- VALUES ('Acme Corp', 'acme-corp', auth.uid());

-- Add a member to organization
-- INSERT INTO organization_members (organization_id, user_id, role)
-- VALUES ('org-uuid', 'user-uuid', 'member');

-- Create a project
-- INSERT INTO projects (organization_id, name, slug, description, created_by)
-- VALUES ('org-uuid', 'Main Website', 'main-website', 'Production servers', auth.uid());

-- Get user's organizations with counts
-- SELECT * FROM public.get_user_organizations();

-- Get organization's projects
-- SELECT * FROM public.get_organization_projects('org-uuid');