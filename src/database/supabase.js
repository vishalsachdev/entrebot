/**
 * Supabase Database Client
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let supabase = null;

/**
 * Initialize Supabase client
 */
export const initializeSupabase = () => {
  try {
    supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          persistSession: false
        }
      }
    );

    logger.info('✅ Supabase client initialized');
    return supabase;
  } catch (error) {
    logger.error('Failed to initialize Supabase:', error);
    throw error;
  }
};

/**
 * Get Supabase client instance
 */
export const getSupabase = () => {
  if (!supabase) {
    return initializeSupabase();
  }
  return supabase;
};

export default { initializeSupabase, getSupabase };
