-- =====================================================
-- COMPLETE ORGANIZATIONS SCHEMA WITH ID-BASED ROUTING
-- =====================================================
-- This script will drop and recreate all organization-related tables
-- with proper policies that avoid recursion issues and allow organization creation
-- Updated to remove slug uniqueness constraint for ID-based routing

-- =====================================================
-- STEP 1: DROP EXISTING POLICIES
-- =====================================================
-- Remove all existing policies to start fresh

-- Drop organizations policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Organization owners can delete" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations CASCADE;
DROP POLICY IF EXISTS "Owners can delete their organizations" ON public.organizations CASCADE;

-- Drop organization members policies
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Owners can manage members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Owners can add members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Owners can update members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Owners can remove members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Organization admins can manage members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Organization owners can insert members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Organization owners can update members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Organization owners can delete members" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Simple member view policy" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Simple owner manage policy" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Simple owner update policy" ON public.organization_members CASCADE;
DROP POLICY IF EXISTS "Simple owner delete policy" ON public.organization_members CASCADE;

-- Drop projects policies
DROP POLICY IF EXISTS "Members can view organization projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Organization admins can manage projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Organization owners/admins can manage projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Owners and admins can manage projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Admins can create projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects CASCADE;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects CASCADE;

-- =====================================================
-- STEP 2: DROP EXISTING TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;

-- =====================================================
-- STEP 3: DROP EXISTING FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS public.create_organization_with_owner();
DROP FUNCTION IF EXISTS public.generate_slug(input_text TEXT);
DROP FUNCTION IF EXISTS public.is_organization_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_organization_owner(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_organization_admin(UUID, UUID);

-- =====================================================
-- STEP 4: DROP EXISTING TABLES
-- =====================================================
-- CASCADE will drop all dependent objects

DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- =====================================================
-- STEP 5: CREATE TABLES
-- =====================================================

-- Organizations table - stores company/team information
-- IMPORTANT: slug is NOT UNIQUE anymore to allow duplicate organization names
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,  -- URL-friendly name (NOT UNIQUE - just for SEO/display)
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members table - manages team access
CREATE TABLE public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)  -- Prevent duplicate memberships
);

-- Projects table - groups servers/resources within organizations
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)  -- Unique slug per organization (projects still need unique slugs within an org)
);

-- =====================================================
-- STEP 6: CREATE INDEXES
-- =====================================================
-- Improve query performance

CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug); -- Still useful for search/display
CREATE INDEX idx_organizations_name ON public.organizations(name); -- Add name index for searching
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_role ON public.organization_members(role);
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_projects_slug ON public.projects(slug);

-- =====================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to generate URL-friendly slug from text
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(input_text),
        '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
      ),
      '\s+', '-', 'g'  -- Replace spaces with hyphens
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to automatically add creator as owner member
CREATE OR REPLACE FUNCTION public.create_organization_with_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the organization creator as an owner member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  -- Log the action (only if audit_logs table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id)
    VALUES (NEW.owner_id, 'organization.created', 'organization', NEW.id::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security definer function to check organization membership
-- This avoids recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = org_id 
    AND organization_members.user_id = user_id
  ) INTO is_member;
  
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security definer function to check organization ownership
CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.organizations 
    WHERE id = org_id 
    AND owner_id = user_id
  ) INTO is_owner;
  
  RETURN is_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or owner
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = org_id 
    AND organization_members.user_id = user_id
    AND role IN ('owner', 'admin')
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: CREATE TRIGGERS
-- =====================================================

-- Automatically add creator as owner when organization is created
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_organization_with_owner();

-- Update the updated_at timestamp automatically
-- Note: This assumes update_updated_at_column() function exists from profiles setup
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 10: CREATE RLS POLICIES (WITH ALL FIXES)
-- =====================================================

-- ORGANIZATIONS POLICIES

-- Users can view organizations where they are the owner OR a member
CREATE POLICY "Users can view their organizations" 
  ON public.organizations 
  FOR SELECT 
  USING (
    -- Either the user is the owner OR they are a member
    owner_id = auth.uid() 
    OR 
    public.is_organization_member(id, auth.uid())
  );

-- Any authenticated user can create an organization (and become the owner)
CREATE POLICY "Users can create organizations" 
  ON public.organizations 
  FOR INSERT 
  WITH CHECK (
    -- User must be authenticated and setting themselves as the owner
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id
  );

-- Only owners can update their organizations
CREATE POLICY "Owners can update their organizations" 
  ON public.organizations 
  FOR UPDATE 
  USING (owner_id = auth.uid());

-- Only owners can delete their organizations
CREATE POLICY "Owners can delete their organizations" 
  ON public.organizations 
  FOR DELETE 
  USING (owner_id = auth.uid());

-- ORGANIZATION MEMBERS POLICIES (Using security definer functions to avoid recursion)

-- Members can view all members in their organizations
CREATE POLICY "Members can view organization members" 
  ON public.organization_members 
  FOR SELECT 
  USING (
    public.is_organization_member(organization_id, auth.uid())
  );

-- Only owners can add new members
CREATE POLICY "Owners can add members" 
  ON public.organization_members 
  FOR INSERT 
  WITH CHECK (
    public.is_organization_owner(organization_id, auth.uid())
  );

-- Only owners can update member roles
CREATE POLICY "Owners can update members" 
  ON public.organization_members 
  FOR UPDATE 
  USING (
    public.is_organization_owner(organization_id, auth.uid())
  );

-- Only owners can remove members
CREATE POLICY "Owners can remove members" 
  ON public.organization_members 
  FOR DELETE 
  USING (
    public.is_organization_owner(organization_id, auth.uid())
  );

-- PROJECTS POLICIES

-- Members can view all projects in their organizations
CREATE POLICY "Members can view organization projects" 
  ON public.projects 
  FOR SELECT 
  USING (
    public.is_organization_member(organization_id, auth.uid())
  );

-- Only admins and owners can create projects
CREATE POLICY "Admins can create projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (
    public.is_organization_admin(organization_id, auth.uid())
  );

-- Only admins and owners can update projects
CREATE POLICY "Admins can update projects" 
  ON public.projects 
  FOR UPDATE 
  USING (
    public.is_organization_admin(organization_id, auth.uid())
  );

-- Only admins and owners can delete projects
CREATE POLICY "Admins can delete projects" 
  ON public.projects 
  FOR DELETE 
  USING (
    public.is_organization_admin(organization_id, auth.uid())
  );

-- =====================================================
-- STEP 11: GRANT PERMISSIONS
-- =====================================================

-- Grant table permissions to authenticated users
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organization_members TO authenticated;
GRANT ALL ON public.projects TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_slug(TEXT) TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- STEP 12: SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Test creating organizations with duplicate names (now allowed!)
-- INSERT INTO public.organizations (name, slug, owner_id) 
-- VALUES 
--   ('Acme Corp', 'acme-corp', auth.uid()),
--   ('Acme Corp', 'acme-corp', auth.uid()); -- This will work now!

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all tables were created with row counts
SELECT 
  t.table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = t.table_name AND table_schema = 'public' AND constraint_type = 'PRIMARY KEY') as has_pk,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = t.table_name AND table_schema = 'public' AND constraint_type = 'FOREIGN KEY') as foreign_keys,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = t.table_name AND table_schema = 'public' AND constraint_type = 'UNIQUE') as unique_constraints
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
AND t.table_name IN ('organizations', 'organization_members', 'projects')
ORDER BY t.table_name;

-- Verify slug is NOT unique on organizations table
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'organizations'
    AND tc.constraint_type = 'UNIQUE';

-- Check all policies were created
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_members', 'projects')
ORDER BY tablename, policyname;

-- Check all functions were created
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_organization_member', 'is_organization_owner', 'is_organization_admin', 'create_organization_with_owner', 'generate_slug')
ORDER BY routine_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_members', 'projects');

-- =====================================================
-- COMMON OPERATIONS EXAMPLES
-- =====================================================

-- Create organizations with same name (now possible!)
-- INSERT INTO organizations (name, slug, owner_id) 
-- VALUES 
--   ('My Company', 'my-company', auth.uid()),
--   ('My Company', 'my-company', auth.uid()); -- Both will have same name and slug

-- Get organization by ID (new approach)
-- SELECT * FROM organizations WHERE id = 'your-uuid-here';

-- Add a member to organization
-- INSERT INTO organization_members (organization_id, user_id, role)
-- VALUES ('org-uuid-here', 'user-uuid-here', 'member');

-- Create a project in an organization
-- INSERT INTO projects (organization_id, name, slug, description)
-- VALUES ('org-uuid-here', 'Main Website', 'main-website', 'Production web servers');

-- Get all organizations for current user with counts
-- SELECT 
--   o.*,
--   COUNT(DISTINCT om.user_id) as member_count,
--   COUNT(DISTINCT p.id) as project_count
-- FROM organizations o
-- LEFT JOIN organization_members om ON om.organization_id = o.id
-- LEFT JOIN projects p ON p.organization_id = o.id
-- WHERE o.id IN (
--   SELECT organization_id 
--   FROM organization_members 
--   WHERE user_id = auth.uid()
-- )
-- GROUP BY o.id
-- ORDER BY o.created_at DESC;

-- =====================================================
-- MIGRATION NOTE
-- =====================================================
-- If you're migrating from slug-based to ID-based routing:
-- 1. Update all frontend links to use organization.id instead of organization.slug
-- 2. Update API calls to fetch by ID instead of slug
-- 3. Slugs are now just for display/SEO purposes

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If you get "infinite recursion detected":
-- 1. Check that all policies use the security definer functions
-- 2. Ensure no policy directly queries the same table it's protecting

-- If you get "new row violates row-level security":
-- 1. Check the INSERT policies allow the operation
-- 2. Verify auth.uid() is not null
-- 3. Ensure you're setting yourself as the owner

-- If organizations don't show up:
-- 1. Check you're a member in organization_members
-- 2. Verify the SELECT policy includes owner check