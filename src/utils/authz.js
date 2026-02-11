import { projectQueries, sessionQueries, userQueries } from '../database/queries.js';

export async function resolveAuthenticatedAppUserId(req) {
  const email = req.user?.email;
  if (!email) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  const existing = await userQueries.getByEmail(email);
  if (existing.success && existing.user?.id) {
    return existing.user.id;
  }

  const created = await userQueries.create(email, { name: email.split('@')[0] });
  if (!created.success || !created.user?.id) {
    throw new Error(created.error || 'Failed to resolve authenticated user');
  }
  return created.user.id;
}

export async function requireSessionOwnership(sessionId, userId, actionVerb = 'access') {
  const sessionResult = await sessionQueries.getById(sessionId);
  if (!sessionResult.success) {
    throw new Error(sessionResult.error);
  }

  if (!sessionResult.session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    throw error;
  }

  if (sessionResult.session.user_id !== userId) {
    const error = new Error(`You can only ${actionVerb} your own sessions`);
    error.statusCode = 403;
    throw error;
  }

  return sessionResult.session;
}

export async function requireProjectOwnership(projectId, userId, actionVerb = 'access') {
  const projectResult = await projectQueries.getById(projectId);
  if (!projectResult.success) {
    throw new Error(projectResult.error);
  }

  if (!projectResult.project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  if (projectResult.project.user_id !== userId) {
    const error = new Error(`You can only ${actionVerb} your own projects`);
    error.statusCode = 403;
    throw error;
  }

  return projectResult.project;
}
