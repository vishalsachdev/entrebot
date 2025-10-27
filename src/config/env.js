/**
 * Environment Configuration
 * Validates and exports environment variables with fail-fast behavior
 */

import dotenv from 'dotenv';

dotenv.config();

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'OPENAI_API_KEY'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('📝 Please create a .env file based on .env.example');
  process.exit(1);
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: 4096,
    temperature: 0.7
  },

  // WhatsApp (optional)
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp_session'
  },

  // Security
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};

export default config;
