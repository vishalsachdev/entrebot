/**
 * Auth Routes
 * Email/password auth using Supabase Auth with app-level user profile sync.
 */

import express from 'express';
import Joi from 'joi';
import { asyncHandler } from '../middleware/error.js';
import { validateBody } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { getSupabase, getSupabaseAdmin } from '../database/supabase.js';
import { userQueries } from '../database/queries.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().min(1).max(200).optional(),
  name: Joi.string().min(1).max(200).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const toAppUser = user => ({
  id: user.id,
  email: user.email,
  name: user.name || user.email?.split('@')?.[0] || 'User',
  created_at: user.created_at,
  updated_at: user.updated_at
});

async function ensureAppUser(email, preferredName = null) {
  const existing = await userQueries.getByEmail(email);
  if (existing.success && existing.user) {
    return existing.user;
  }

  const created = await userQueries.create(email, { name: preferredName });
  if (!created.success || !created.user) {
    throw new Error(created.error || 'Failed to create user profile');
  }

  return created.user;
}

/**
 * POST /api/v1/auth/register
 */
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, full_name, name } = req.body;
    const displayName = full_name || name || email.split('@')[0];
    const supabase = getSupabase();

    let { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName
        }
      }
    });

    // Fallback: if Supabase public sign-up is rate limited, use admin user creation.
    if (error && /rate limit/i.test(error.message || '')) {
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        logger.warn('Public sign-up rate limited; attempting admin createUser fallback');

        const { error: adminError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: displayName
          }
        });

        if (!adminError) {
          const signInResult = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (!signInResult.error && signInResult.data?.session) {
            data = {
              ...data,
              session: signInResult.data.session,
              user: signInResult.data.user
            };
            error = null;
          } else {
            logger.error(
              'Admin register fallback created user but sign-in failed:',
              signInResult.error?.message || 'No session returned'
            );
            return res.status(500).json({
              success: false,
              error: 'Account created, but sign-in failed. Please try logging in.'
            });
          }
        } else {
          error = adminError;
        }
      }
    }

    if (error) {
      logger.warn('Auth register failed:', error.message);
      const isRateLimited = /rate limit/i.test(error.message || '');
      return res.status(isRateLimited ? 429 : 400).json({
        success: false,
        error: isRateLimited
          ? 'Too many sign-up attempts right now. Please wait a minute and try again.'
          : error.message
      });
    }

    const appUser = await ensureAppUser(email, displayName);

    let sessionPayload = null;
    if (data.session) {
      sessionPayload = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type
      };
    }

    res.status(201).json({
      success: true,
      user: toAppUser(appUser),
      session: sessionPayload,
      requires_email_verification: !data.session
    });
  })
);

/**
 * POST /api/v1/auth/login
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      logger.warn('Auth login failed:', error?.message || 'No session returned');
      const isEmailUnconfirmed = /email not confirmed/i.test(error?.message || '');
      return res.status(401).json({
        success: false,
        error: isEmailUnconfirmed
          ? 'Your email is not verified yet. Please check your inbox and confirm your email, then sign in.'
          : error?.message || 'Invalid credentials'
      });
    }

    const appUser = await ensureAppUser(email, data.user?.user_metadata?.full_name || null);

    res.status(200).json({
      success: true,
      user: toAppUser(appUser),
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type
      }
    });
  })
);

/**
 * POST /api/v1/auth/forgot-password
 */
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const supabase = getSupabase();

    const base = (config.app.frontendUrl || `${req.protocol}://${req.get('host')}`).replace(
      /\/$/,
      ''
    );
    const redirectTo = `${base}/login`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      logger.warn('Forgot-password request failed:', error.message);
      // Return generic success to avoid leaking account existence.
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a reset link has been sent.'
    });
  })
);

/**
 * GET /api/v1/auth/me
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication context'
      });
    }

    const existing = await userQueries.getByEmail(email);
    if (!existing.success) {
      throw new Error(existing.error);
    }

    const appUser = existing.user || (await ensureAppUser(email, null));

    res.status(200).json({
      success: true,
      user: toAppUser(appUser)
    });
  })
);

/**
 * POST /api/v1/auth/logout
 */
router.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    // Token invalidation for JWTs is typically handled client-side by removing tokens.
    res.status(200).json({
      success: true
    });
  })
);

export default router;
