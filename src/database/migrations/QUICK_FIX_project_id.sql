-- QUICK FIX: Add project_id column to sessions table
-- Copy and paste this entire script into Supabase SQL Editor and click "Run"

-- Step 1: Add the column
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON public.sessions(project_id);

-- Step 3: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Done! Verify by running:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'sessions';
