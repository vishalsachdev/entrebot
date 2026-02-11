/**
 * Supabase Database Client
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let supabase = null;
let supabaseAdmin = null;

/**
 * Initialize Supabase client
 */
export const initializeSupabase = () => {
  try {
    supabase = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        persistSession: false
      }
    });

    logger.info('✅ Supabase client initialized');
    return supabase;
  } catch (error) {
    logger.error('Failed to initialize Supabase:', error);
    throw error;
  }
};

/**
 * Initialize Supabase admin client (service role)
 */
export const initializeSupabaseAdmin = () => {
  if (!config.supabase.serviceRoleKey) {
    logger.warn('SUPABASE_SERVICE_ROLE_KEY is not configured; admin auth features are disabled');
    return null;
  }

  try {
    supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        persistSession: false
      }
    });

    logger.info('✅ Supabase admin client initialized');
    return supabaseAdmin;
  } catch (error) {
    logger.error('Failed to initialize Supabase admin client:', error);
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

/**
 * Get Supabase admin client instance
 */
export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    return initializeSupabaseAdmin();
  }
  return supabaseAdmin;
};

export default { initializeSupabase, getSupabase, initializeSupabaseAdmin, getSupabaseAdmin };
