-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR CONNECTIX (with OAuth & profile fixes)
-- =====================================================

-- Drop all tables (CASCADE drops everything related)
DROP TABLE IF EXISTS public.connection_activity_logs CASCADE;
DROP TABLE IF EXISTS public.connection_sessions CASCADE;
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.encryption_keys CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.create_organization_with_owner() CASCADE;
DROP FUNCTION IF EXISTS public.generate_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_organization_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_organization_owner(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_organization_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_project_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_organizations() CASCADE;
DROP FUNCTION IF EXISTS public.get_organization_projects(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_connection(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_connection(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS public.log_connection_activity() CASCADE;
DROP FUNCTION IF EXISTS public.get_encryption_key_id(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.validate_connection_project() CASCADE;

-- Drop trigger on auth.users (if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  two_factor_enabled BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Audit logs
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

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Organizations
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_name ON public.organizations(name);

-- Organization members
CREATE TABLE public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_role ON public.organization_members(role);

-- Projects
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

CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);

-- Encryption keys
CREATE TABLE public.encryption_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  UNIQUE(organization_id, key_version)
);

CREATE INDEX idx_encryption_keys_organization_id ON public.encryption_keys(organization_id);
CREATE INDEX idx_encryption_keys_active ON public.encryption_keys(is_active);

-- Connections
CREATE TABLE public.connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 22,
  username TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('password', 'private_key', 'key_with_passphrase')),
  encrypted_credentials TEXT NOT NULL,
  encryption_key_id UUID REFERENCES public.encryption_keys(id) NOT NULL,
  proxy_jump TEXT,
  connection_timeout INTEGER DEFAULT 30,
  keepalive_interval INTEGER DEFAULT 60,
  strict_host_checking BOOLEAN DEFAULT TRUE,
  custom_options JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_used_at TIMESTAMPTZ,
  last_used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  connection_test_status TEXT CHECK (connection_test_status IN ('untested', 'success', 'failed')),
  last_test_at TIMESTAMPTZ,
  last_test_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connections_organization_id ON public.connections(organization_id);
CREATE INDEX idx_connections_project_id ON public.connections(project_id);
CREATE INDEX idx_connections_created_by ON public.connections(created_by);
CREATE INDEX idx_connections_last_used ON public.connections(last_used_at DESC);

-- Connection sessions
CREATE TABLE public.connection_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  client_ip INET,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'disconnected', 'terminated')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  termination_reason TEXT,
  bytes_uploaded BIGINT DEFAULT 0,
  bytes_downloaded BIGINT DEFAULT 0,
  commands_executed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connection_sessions_connection_id ON public.connection_sessions(connection_id);
CREATE INDEX idx_connection_sessions_user_id ON public.connection_sessions(user_id);
CREATE INDEX idx_connection_sessions_status ON public.connection_sessions(status);
CREATE INDEX idx_connection_sessions_token ON public.connection_sessions(session_token);

-- Connection activity logs (with CASCADE DELETE)
CREATE TABLE public.connection_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.connection_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'connection.created', 'connection.updated', 'connection.deleted',
    'connection.tested', 'session.started', 'session.ended',
    'file.read', 'file.write', 'file.delete', 'file.rename',
    'directory.create', 'directory.delete', 'directory.list',
    'command.execute', 'error.occurred'
  )),
  details JSONB,
  ip_address INET,
  duration_ms INTEGER,
  bytes_affected BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connection_activity_logs_connection_id ON public.connection_activity_logs(connection_id);
CREATE INDEX idx_connection_activity_logs_session_id ON public.connection_activity_logs(session_id);
CREATE INDEX idx_connection_activity_logs_user_id ON public.connection_activity_logs(user_id);
CREATE INDEX idx_connection_activity_logs_created_at ON public.connection_activity_logs(created_at DESC);
CREATE INDEX idx_connection_activity_logs_activity_type ON public.connection_activity_logs(activity_type);

-- =====================================================
-- CREATE FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user (FIXED for OAuth providers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  random_suffix TEXT;
BEGIN
  -- Extract username from various possible sources
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',      -- Standard field
    NEW.raw_user_meta_data->>'user_name',     -- GitHub
    NEW.raw_user_meta_data->>'preferred_username', -- Some OAuth providers
    NEW.raw_user_meta_data->>'nickname',      -- Some OAuth providers
    split_part(NEW.email, '@', 1)             -- Fallback to email prefix
  );
  
  -- Clean the username (remove spaces, special chars)
  new_username := LOWER(REGEXP_REPLACE(new_username, '[^a-zA-Z0-9_-]', '_', 'g'));
  
  -- Ensure username is not empty
  IF new_username IS NULL OR new_username = '' THEN
    new_username := 'user';
  END IF;
  
  -- Try to insert the profile
  BEGIN
    INSERT INTO public.profiles (id, email, username)
    VALUES (NEW.id, NEW.email, new_username);
  EXCEPTION
    WHEN unique_violation THEN
      -- Username already taken, try with random suffix
      random_suffix := substr(md5(random()::text), 1, 6);
      new_username := new_username || '_' || random_suffix;
      
      -- Try again with suffix
      BEGIN
        INSERT INTO public.profiles (id, email, username)
        VALUES (NEW.id, NEW.email, new_username);
      EXCEPTION
        WHEN OTHERS THEN
          -- If still fails, use user ID as username
          new_username := 'user_' || substr(NEW.id::text, 1, 8);
          INSERT INTO public.profiles (id, email, username)
          VALUES (NEW.id, NEW.email, new_username)
          ON CONFLICT (id) DO NOTHING;
      END;
  END;
  
  -- Try to create audit log (don't fail if this errors)
  BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id)
    VALUES (NEW.id, 'user.signup', 'user', NEW.id::TEXT);
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignore audit log errors
      NULL;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate slug
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

-- Create organization with owner
CREATE OR REPLACE FUNCTION public.create_organization_with_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  INSERT INTO public.encryption_keys (organization_id, encrypted_key)
  VALUES (NEW.id, 'PLACEHOLDER_ENCRYPTED_KEY');
  
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id)
  VALUES (NEW.owner_id, 'organization.created', 'organization', NEW.id::TEXT);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check organization membership
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

-- Check organization ownership
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

-- Check if admin or owner
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

-- Check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(project_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.projects
  WHERE id = project_id;
  
  IF org_id IS NOT NULL THEN
    RETURN public.is_organization_member(org_id, check_user_id);
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user organizations
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

-- Get organization projects
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
  created_by_username TEXT,
  connections_count BIGINT
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
    pr.username as created_by_username,
    COUNT(DISTINCT c.id) as connections_count
  FROM public.projects p
  LEFT JOIN public.profiles pr ON pr.id = p.created_by
  LEFT JOIN public.connections c ON c.project_id = p.id
  WHERE p.organization_id = org_id
    AND public.is_organization_member(org_id, auth.uid())
  GROUP BY p.id, pr.username
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check connection access
CREATE OR REPLACE FUNCTION public.can_access_connection(conn_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  conn RECORD;
BEGIN
  SELECT organization_id, project_id INTO conn
  FROM public.connections
  WHERE id = conn_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF conn.project_id IS NOT NULL THEN
    RETURN public.is_project_member(conn.project_id, check_user_id);
  END IF;
  
  RETURN public.is_organization_member(conn.organization_id, check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check connection management
CREATE OR REPLACE FUNCTION public.can_manage_connection(conn_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  conn RECORD;
BEGIN
  SELECT organization_id, project_id INTO conn
  FROM public.connections
  WHERE id = conn_id;
  
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  RETURN public.is_organization_admin(conn.organization_id, check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get encryption key
CREATE OR REPLACE FUNCTION public.get_encryption_key_id(org_id UUID, proj_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  key_id UUID;
BEGIN
  SELECT id INTO key_id
  FROM public.encryption_keys
  WHERE organization_id = org_id
    AND is_active = TRUE
  ORDER BY key_version DESC
  LIMIT 1;
  
  RETURN key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.connection_sessions
  SET status = 'disconnected',
      ended_at = NOW(),
      termination_reason = 'Idle timeout'
  WHERE status = 'active'
    AND last_activity_at < NOW() - INTERVAL '30 minutes';
  
  UPDATE public.connection_sessions
  SET status = 'terminated'
  WHERE status = 'disconnected'
    AND ended_at < NOW() - INTERVAL '1 hour';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log connection activity (with proper DELETE handling)
CREATE OR REPLACE FUNCTION public.log_connection_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  activity_type TEXT;
  user_id UUID;
  conn_id UUID;
  log_details JSONB;
BEGIN
  user_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    activity_type := 'connection.created';
    conn_id := NEW.id;
    log_details := jsonb_build_object(
      'operation', TG_OP,
      'connection_name', NEW.name,
      'host', NEW.host,
      'username', NEW.username
    );
  ELSIF TG_OP = 'UPDATE' THEN
    activity_type := 'connection.updated';
    conn_id := NEW.id;
    log_details := jsonb_build_object(
      'operation', TG_OP,
      'connection_name', NEW.name,
      'host', NEW.host,
      'username', NEW.username,
      'changes', jsonb_build_object(
        'name_changed', (OLD.name <> NEW.name),
        'host_changed', (OLD.host <> NEW.host),
        'username_changed', (OLD.username <> NEW.username)
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    activity_type := 'connection.deleted';
    conn_id := OLD.id;
    user_id := COALESCE(auth.uid(), OLD.created_by);
    log_details := jsonb_build_object(
      'operation', TG_OP,
      'connection_name', OLD.name,
      'host', OLD.host,
      'username', OLD.username
    );
  END IF;
  
  -- Insert the log entry
  INSERT INTO public.connection_activity_logs (
    connection_id,
    user_id,
    activity_type,
    details,
    ip_address
  ) VALUES (
    conn_id,
    user_id,
    activity_type,
    log_details,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Validate connection project
CREATE OR REPLACE FUNCTION public.validate_connection_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = NEW.project_id 
      AND p.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'Project must belong to the specified organization';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

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

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connection_sessions_updated_at
  BEFORE UPDATE ON public.connection_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_organization_with_owner();

-- Split triggers for proper timing
CREATE TRIGGER log_connection_changes_before_delete
  BEFORE DELETE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.log_connection_activity();

CREATE TRIGGER log_connection_changes_after_modify
  AFTER INSERT OR UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.log_connection_activity();

CREATE TRIGGER cleanup_expired_sessions
  AFTER INSERT OR UPDATE ON public.connection_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_sessions();

CREATE TRIGGER validate_connection_project
  BEFORE INSERT OR UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_connection_project();

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE POLICIES (with fixed profile policies)
-- =====================================================

-- Profiles (FIXED for OAuth and triggers)
CREATE POLICY "Users can view any profile" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- This ensures the trigger can create profiles
CREATE POLICY "System can create profiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (true);

-- Audit logs
CREATE POLICY "Users can view own audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create audit logs" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Also allow system to create audit logs
CREATE POLICY "System can create audit logs" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (true);

-- Organizations
CREATE POLICY "Users can view their organizations" 
  ON public.organizations FOR SELECT 
  USING (owner_id = auth.uid() OR public.is_organization_member(id, auth.uid()));

CREATE POLICY "Users can create organizations" 
  ON public.organizations FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

CREATE POLICY "Owners can update their organizations" 
  ON public.organizations FOR UPDATE 
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their organizations" 
  ON public.organizations FOR DELETE 
  USING (owner_id = auth.uid());

-- Organization members
CREATE POLICY "Members can view organization members" 
  ON public.organization_members FOR SELECT 
  USING (public.is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Owners can add members" 
  ON public.organization_members FOR INSERT 
  WITH CHECK (public.is_organization_owner(organization_id, auth.uid()));

CREATE POLICY "Owners can update members" 
  ON public.organization_members FOR UPDATE 
  USING (public.is_organization_owner(organization_id, auth.uid()));

CREATE POLICY "Owners can remove members" 
  ON public.organization_members FOR DELETE 
  USING (public.is_organization_owner(organization_id, auth.uid()));

-- Projects
CREATE POLICY "Members can view organization projects" 
  ON public.projects FOR SELECT 
  USING (public.is_organization_member(organization_id, auth.uid()));

CREATE POLICY "Admins can create projects" 
  ON public.projects FOR INSERT 
  WITH CHECK (public.is_organization_admin(organization_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Admins can update projects" 
  ON public.projects FOR UPDATE 
  USING (public.is_organization_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can delete projects" 
  ON public.projects FOR DELETE 
  USING (public.is_organization_admin(organization_id, auth.uid()));

-- Connections
CREATE POLICY "Members can view accessible connections" 
  ON public.connections FOR SELECT 
  USING (public.can_access_connection(id, auth.uid()));

CREATE POLICY "Authorized users can create connections" 
  ON public.connections FOR INSERT 
  WITH CHECK (public.is_organization_admin(organization_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Authorized users can update connections" 
  ON public.connections FOR UPDATE 
  USING (public.can_manage_connection(id, auth.uid()));

CREATE POLICY "Authorized users can delete connections" 
  ON public.connections FOR DELETE 
  USING (public.can_manage_connection(id, auth.uid()));

-- Connection sessions
CREATE POLICY "Users can view accessible sessions" 
  ON public.connection_sessions FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
      AND public.is_organization_admin(c.organization_id, auth.uid())
    )
  );

CREATE POLICY "Users can create sessions for accessible connections" 
  ON public.connection_sessions FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
      AND public.can_access_connection(c.id, auth.uid())
    )
  );

CREATE POLICY "Users can update their own sessions" 
  ON public.connection_sessions FOR UPDATE 
  USING (user_id = auth.uid());

-- Connection activity logs
CREATE POLICY "Users can view connection activity logs" 
  ON public.connection_activity_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
      AND public.can_access_connection(c.id, auth.uid())
    )
  );

CREATE POLICY "System can create activity logs" 
  ON public.connection_activity_logs FOR INSERT 
  WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organization_members TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT SELECT ON public.encryption_keys TO authenticated;
GRANT ALL ON public.connections TO authenticated;
GRANT ALL ON public.connection_sessions TO authenticated;
GRANT ALL ON public.connection_activity_logs TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_projects(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_connection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_connection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_encryption_key_id(UUID, UUID) TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- FIX EXISTING OAUTH USERS (if any)
-- =====================================================

-- Create profiles for any existing users without them
INSERT INTO public.profiles (id, email, username)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'user_name',
    au.raw_user_meta_data->>'preferred_username',
    au.raw_user_meta_data->>'nickname',
    'user_' || substr(au.id::text, 1, 8)
  ) as username
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;