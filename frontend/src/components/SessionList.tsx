import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionService } from '../services/database';
import type { DbSession } from '../types/database';

interface SessionListProps {
  userId: string;
  onSessionSelect?: (session: DbSession) => void;
  selectedSessionId?: string;
}

export default function SessionList({
  userId,
  onSessionSelect,
  selectedSessionId
}: SessionListProps) {
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await sessionService.getUserSessions(userId);
      // Sort by most recently updated first
      const sorted = data.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setSessions(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setIsCreating(true);
      setError(null);
      const newSession = await sessionService.createSession(userId, {
        created_from: 'web_ui',
        created_at: new Date().toISOString(),
      });
      setSessions(prev => [newSession, ...prev]);
      onSessionSelect?.(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setError(null);
      await sessionService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setShowDeleteConfirm(null);
      if (selectedSessionId === sessionId) {
        onSessionSelect?.(sessions[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-neutral-600">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Sessions</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>
        <button
          onClick={handleCreateSession}
          disabled={isCreating}
          className="btn-primary"
        >
          {isCreating ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </span>
          ) : (
            '+ New Session'
          )}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-700 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">
            No sessions yet
          </h3>
          <p className="text-neutral-500 text-sm mb-6">
            Create your first session to get started
          </p>
          <button onClick={handleCreateSession} className="btn-primary">
            Create First Session
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedSessionId === session.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
                onClick={() => onSessionSelect?.(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-neutral-900">
                        Session {session.id.slice(0, 8)}
                      </h3>
                      {selectedSessionId === session.id && (
                        <span className="badge-primary text-xs">Active</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-neutral-500">Created:</span>
                        <span className="ml-1 text-neutral-700">
                          {formatDate(session.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Updated:</span>
                        <span className="ml-1 text-neutral-700">
                          {formatDate(session.updated_at)}
                        </span>
                      </div>
                    </div>

                    {session.metadata && Object.keys(session.metadata).length > 0 && (
                      <div className="mt-2 text-xs">
                        <span className="text-neutral-500">Metadata:</span>
                        <span className="ml-1 text-neutral-600 font-mono">
                          {Object.keys(session.metadata).length} {
                            Object.keys(session.metadata).length === 1 ? 'item' : 'items'
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(session.id);
                    }}
                    className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete session"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === session.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-neutral-200"
                  >
                    <p className="text-sm text-red-700 mb-3">
                      Are you sure you want to delete this session? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="btn-primary bg-red-600 hover:bg-red-700 text-sm flex-1"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(null);
                        }}
                        className="btn-secondary text-sm flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
