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

      if (error) {
        throw error;
      }
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
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
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

      if (error) {
        throw error;
      }
      return { success: true, user: data };
    } catch (error) {
      logger.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Project Operations
 */
export const projectQueries = {
  /**
   * Create new project
   */
  async create(userId, name, description = null) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            user_id: userId,
            name,
            description,
            status: 'ideation',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return { success: true, project: data };
    } catch (error) {
      logger.error('Error creating project:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all projects for a user
   */
  async getByUserId(userId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }
      return { success: true, projects: data || [] };
    } catch (error) {
      logger.error('Error fetching user projects:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get project by ID
   */
  async getById(projectId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        throw error;
      }
      return { success: true, project: data };
    } catch (error) {
      logger.error('Error fetching project:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update project
   */
  async update(projectId, updates) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return { success: true, project: data };
    } catch (error) {
      logger.error('Error updating project:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete project
   */
  async delete(projectId) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('projects').delete().eq('id', projectId);

      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error) {
      logger.error('Error deleting project:', error);
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
   * @param {string} userId - User ID
   * @param {string|null} projectId - Optional project ID to link session to
   * @param {Object} metadata - Optional session metadata
   */
  async create(userId, projectId = null, metadata = {}) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            user_id: userId,
            project_id: projectId,
            metadata,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }
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

      if (error) {
        throw error;
      }
      return { success: true, session: data };
    } catch (error) {
      logger.error('Error fetching session:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get sessions by project ID
   */
  async getByProjectId(projectId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }
      return { success: true, sessions: data || [] };
    } catch (error) {
      logger.error('Error fetching project sessions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get sessions by user ID
   */
  async getByUserId(userId) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }
      return { success: true, sessions: data || [] };
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
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

      if (error) {
        throw error;
      }
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

      if (error) {
        throw error;
      }
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
        .upsert(
          {
            session_id: sessionId,
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : value,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'session_id,key',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }
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

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return { success: true, value: null };
      }

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

      if (error) {
        throw error;
      }

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
  },

  /**
   * Get multiple memory keys in a single query (batch optimization)
   * @param {string} sessionId - Session identifier
   * @param {string[]} keys - Array of memory keys to fetch
   * @returns {Promise<{success: boolean, values: Object}>}
   */
  async getMultiple(sessionId, keys) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('memory')
        .select('key, value')
        .eq('session_id', sessionId)
        .in('key', keys);

      if (error) {
        throw error;
      }

      const values = {};
      keys.forEach(key => {
        values[key] = null; // Initialize all keys
      });

      (data || []).forEach(item => {
        try {
          values[item.key] = JSON.parse(item.value);
        } catch {
          values[item.key] = item.value;
        }
      });

      return { success: true, values };
    } catch (error) {
      logger.error('Error batch fetching memory:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Set multiple memory key-value pairs in a single query (batch optimization)
   * @param {string} sessionId - Session identifier
   * @param {Object} keyValues - Object of key-value pairs to store
   * @returns {Promise<{success: boolean}>}
   */
  async setMultiple(sessionId, keyValues) {
    try {
      const supabase = getSupabase();
      const timestamp = new Date().toISOString();

      const records = Object.entries(keyValues).map(([key, value]) => ({
        session_id: sessionId,
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        updated_at: timestamp
      }));

      const { error } = await supabase.from('memory').upsert(records, {
        onConflict: 'session_id,key',
        ignoreDuplicates: false
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      logger.error('Error batch storing memory:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Batch Operations - Optimized queries that reduce DB roundtrips
 */
export const batchQueries = {
  /**
   * Get full session context in a single optimized call
   * Combines: session info, recent conversation, and all memory
   * @param {string} sessionId - Session identifier
   * @param {number} historyLimit - Max conversation messages to fetch
   * @returns {Promise<{success: boolean, context: Object}>}
   */
  async getSessionContext(sessionId, historyLimit = 20) {
    try {
      const supabase = getSupabase();

      // Execute all queries in parallel
      const [sessionResult, historyResult, memoryResult] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', sessionId).single(),
        supabase
          .from('conversations')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(historyLimit),
        supabase.from('memory').select('key, value').eq('session_id', sessionId)
      ]);

      // Check for errors
      if (sessionResult.error && sessionResult.error.code !== 'PGRST116') {
        throw sessionResult.error;
      }
      if (historyResult.error) {
        throw historyResult.error;
      }
      if (memoryResult.error) {
        throw memoryResult.error;
      }

      // Parse memory values
      const memory = {};
      (memoryResult.data || []).forEach(item => {
        try {
          memory[item.key] = JSON.parse(item.value);
        } catch {
          memory[item.key] = item.value;
        }
      });

      return {
        success: true,
        context: {
          session: sessionResult.data,
          history: historyResult.data || [],
          memory
        }
      };
    } catch (error) {
      logger.error('Error fetching session context:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Store message and update memory atomically
   * Reduces multiple DB calls to optimized operations
   * @param {string} sessionId - Session identifier
   * @param {string} role - Message role (user/assistant)
   * @param {string} content - Message content
   * @param {Object} metadata - Message metadata
   * @param {Object} memoryUpdates - Optional memory key-values to update
   * @returns {Promise<{success: boolean}>}
   */
  async storeMessageWithMemory(sessionId, role, content, metadata = {}, memoryUpdates = null) {
    try {
      const supabase = getSupabase();
      const timestamp = new Date().toISOString();

      // Store conversation message
      const messagePromise = supabase
        .from('conversations')
        .insert([
          {
            session_id: sessionId,
            role,
            content,
            metadata,
            created_at: timestamp
          }
        ])
        .select()
        .single();

      // Optionally update memory in parallel
      let memoryPromise = Promise.resolve({ error: null });
      if (memoryUpdates && Object.keys(memoryUpdates).length > 0) {
        const records = Object.entries(memoryUpdates).map(([key, value]) => ({
          session_id: sessionId,
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : value,
          updated_at: timestamp
        }));

        memoryPromise = supabase.from('memory').upsert(records, {
          onConflict: 'session_id,key',
          ignoreDuplicates: false
        });
      }

      const [messageResult, memoryResult] = await Promise.all([messagePromise, memoryPromise]);

      if (messageResult.error) {
        throw messageResult.error;
      }
      if (memoryResult.error) {
        throw memoryResult.error;
      }

      return { success: true, message: messageResult.data };
    } catch (error) {
      logger.error('Error storing message with memory:', error);
      return { success: false, error: error.message };
    }
  }
};

export default {
  userQueries,
  projectQueries,
  sessionQueries,
  conversationQueries,
  memoryQueries,
  batchQueries
};
