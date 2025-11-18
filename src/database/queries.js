/**
 * Database Queries
 * Centralized database operations with error handling
 */

import { getSupabase } from './supabase.js';
import { logger } from '../config/logger.js';

/**
 * User Operations
 */
export const userQueries = {
  /**
   * Create new user
   */
  async create(email, userData = {}) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            name: userData.name || null,
            phone: userData.phone || null,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      logger.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user by email
   */
  async getByEmail(email) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, user: data };
    } catch (error) {
      logger.error('Error fetching user:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user profile
   */
  async update(userId, updates) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      logger.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Session Operations
 */
export const sessionQueries = {
  /**
   * Create new session
   */
  async create(userId, metadata = {}) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            user_id: userId,
            metadata,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, session: data };
    } catch (error) {
      logger.error('Error creating session:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get session by ID
   */
  async getById(sessionId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return { success: true, session: data };
    } catch (error) {
      logger.error('Error fetching session:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Conversation Operations
 */
export const conversationQueries = {
  /**
   * Store conversation message
   */
  async create(sessionId, role, content, metadata = {}) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            session_id: sessionId,
            role,
            content,
            metadata,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: data };
    } catch (error) {
      logger.error('Error storing conversation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get conversation history
   */
  async getHistory(sessionId, limit = 50) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, messages: data || [] };
    } catch (error) {
      logger.error('Error fetching conversation history:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Memory Operations
 */
export const memoryQueries = {
  /**
   * Store memory key-value pair
   */
  async set(sessionId, key, value) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('memory')
        .upsert([
          {
            session_id: sessionId,
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : value,
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, memory: data };
    } catch (error) {
      logger.error('Error storing memory:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get memory value by key
   */
  async get(sessionId, key) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('memory')
        .select('value')
        .eq('session_id', sessionId)
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return { success: true, value: null };

      // Try to parse JSON, otherwise return raw value
      try {
        return { success: true, value: JSON.parse(data.value) };
      } catch {
        return { success: true, value: data.value };
      }
    } catch (error) {
      logger.error('Error fetching memory:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all memory for session
   */
  async getAll(sessionId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('memory')
        .select('key, value')
        .eq('session_id', sessionId);

      if (error) throw error;

      const memory = {};
      (data || []).forEach(item => {
        try {
          memory[item.key] = JSON.parse(item.value);
        } catch {
          memory[item.key] = item.value;
        }
      });

      return { success: true, memory };
    } catch (error) {
      logger.error('Error fetching all memory:', error);
      return { success: false, error: error.message };
    }
  }
};

export default {
  userQueries,
  sessionQueries,
  conversationQueries,
  memoryQueries
};
