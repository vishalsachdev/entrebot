#!/usr/bin/env node
/**
 * Schema Fix Script
 * Checks if project_id column exists in sessions table and provides fix instructions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking sessions table schema...\n');

  try {
    // Try to query sessions with project_id to see if it exists
    const { data, error } = await supabase
      .from('sessions')
      .select('id, user_id, project_id')
      .limit(1);

    if (error) {
      if (error.message.includes('project_id')) {
        console.log('❌ PROBLEM FOUND: project_id column is missing from sessions table\n');
        console.log('📋 TO FIX: Run this SQL in Supabase Dashboard > SQL Editor:\n');
        console.log('─'.repeat(60));
        console.log(`
-- Add project_id column to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON public.sessions(project_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`);
        console.log('─'.repeat(60));
        console.log('\n🔗 Go to: https://supabase.com/dashboard/project/zdtrnfexjviccudkaufu/sql/new');
        return false;
      }
      throw error;
    }

    console.log('✅ SUCCESS: project_id column exists in sessions table');
    console.log(`   Found ${data?.length || 0} session(s) in database`);
    return true;

  } catch (err) {
    console.error('❌ Error checking schema:', err.message);
    return false;
  }
}

async function checkProjectsTable() {
  console.log('\n🔍 Checking projects table...');

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Projects table may not exist or is not accessible');
      console.log('   Error:', error.message);
      return false;
    }

    console.log('✅ Projects table exists');
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  SUPABASE SCHEMA CHECK');
  console.log('═'.repeat(60));
  console.log(`  URL: ${process.env.SUPABASE_URL}`);
  console.log('═'.repeat(60) + '\n');

  await checkProjectsTable();
  const ok = await checkSchema();

  console.log('\n' + '═'.repeat(60));
  if (ok) {
    console.log('  ✅ Schema is correct - your app should work!');
  } else {
    console.log('  ⚠️  Schema needs fixing - follow instructions above');
  }
  console.log('═'.repeat(60) + '\n');

  process.exit(ok ? 0 : 1);
}

main();
