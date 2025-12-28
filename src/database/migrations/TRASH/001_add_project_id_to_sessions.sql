-- Migration: Add project_id column to sessions table
-- Run this in Supabase SQL Editor to fix the schema cache error
-- Date: 2024-12-28
--
-- Error being fixed:
--   "Could not find the 'project_id' column of 'sessions' in the schema cache"

-- ============================================================================
-- STEP 1: Add the project_id column to sessions table (if not exists)
-- ============================================================================

-- Check if column exists first, then add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.sessions
        ADD COLUMN project_id UUID;

        RAISE NOTICE 'Added project_id column to sessions table';
    ELSE
        RAISE NOTICE 'project_id column already exists in sessions table';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Add foreign key constraint (if not exists)
-- ============================================================================

-- Check if the projects table exists first
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) THEN
        -- Check if FK constraint already exists
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'sessions'
            AND kcu.column_name = 'project_id'
            AND tc.constraint_type = 'FOREIGN KEY'
        ) THEN
            ALTER TABLE public.sessions
            ADD CONSTRAINT sessions_project_id_fkey
            FOREIGN KEY (project_id)
            REFERENCES public.projects(id)
            ON DELETE SET NULL;

            RAISE NOTICE 'Added foreign key constraint for project_id';
        ELSE
            RAISE NOTICE 'Foreign key constraint already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Projects table does not exist - skipping FK constraint';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Create index for efficient lookups (if not exists)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sessions_project_id
ON public.sessions(project_id);

-- ============================================================================
-- STEP 4: Force PostgREST schema cache reload
-- ============================================================================

-- This notifies PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION: Check that the column was added successfully
-- ============================================================================

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'sessions'
ORDER BY ordinal_position;
