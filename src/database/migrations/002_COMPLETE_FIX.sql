-- COMPLETE FIX: Run this in Supabase SQL Editor
-- Order matters: projects table must exist before FK constraint

-- ============================================================================
-- STEP 1: Enable UUID extension (if not already enabled)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: Create projects table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ideation' CHECK (
    status IN (
      'ideation',
      'validation',
      'planning',
      'building',
      'launched',
      'active',
      'paused',
      'abandoned'
    )
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Add project_id column to sessions (WITHOUT FK first)
-- ============================================================================
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS project_id UUID;

-- ============================================================================
-- STEP 4: Add FK constraint separately (safer)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sessions_project_id_fkey'
  ) THEN
    ALTER TABLE sessions
    ADD CONSTRAINT sessions_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);

-- ============================================================================
-- STEP 6: Add update trigger for projects
-- ============================================================================
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: Reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'projects table' as item, count(*) as exists FROM information_schema.tables WHERE table_name = 'projects'
UNION ALL
SELECT 'sessions.project_id' as item, count(*) as exists FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'project_id';
