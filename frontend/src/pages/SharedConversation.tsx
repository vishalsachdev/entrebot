import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Copy, GitFork, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface SharedMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

interface SharedConversationData {
  share_id: string;
  title?: string | null;
  description?: string | null;
  created_at: string;
  allow_forking: boolean;
  view_count: number;
  fork_count: number;
  messages: SharedMessage[];
}

const SharedConversation = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isForking, setIsForking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharedConversationData | null>(null);

  useEffect(() => {
    if (!shareId) {
      setError('Invalid share link');
      setIsLoading(false);
      return;
    }

    const loadSharedConversation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/shared/${shareId}`);
        const payload = await response.json();

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Shared conversation not found');
        }

        setData(payload.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load shared conversation'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedConversation();
  }, [shareId]);

  const shareUrl = useMemo(() => {
    return shareId
      ? `${window.location.origin}/shared/${shareId}`
      : window.location.href;
  }, [shareId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handleFork = async () => {
    if (!shareId) return;

    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: { pathname: `/shared/${shareId}` } },
      });
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login', {
        state: { from: { pathname: `/shared/${shareId}` } },
      });
      return;
    }

    try {
      setIsForking(true);
      const response = await fetch(`${API_BASE_URL}/shared/${shareId}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success || !payload.data?.session_id) {
        throw new Error(payload.error || 'Failed to fork this journey');
      }

      localStorage.setItem('venturebot_session_id', payload.data.session_id);
      navigate('/agents');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fork shared conversation'
      );
    } finally {
      setIsForking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-neutral-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading shared conversation...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-6">
          <h1 className="text-lg font-semibold text-neutral-900 mb-2">
            Share Link Unavailable
          </h1>
          <p className="text-sm text-neutral-600 mb-4">
            {error || 'This link is invalid.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-3 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            Open VentureBot
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <header className="bg-white border border-neutral-200 rounded-xl p-5 mb-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
            Shared VentureBot Journey
          </p>
          <h1 className="text-xl font-semibold text-neutral-900">
            {data.title || 'Untitled shared conversation'}
          </h1>
          {data.description && (
            <p className="text-sm text-neutral-600 mt-1">{data.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-3">
            <span>{data.messages.length} messages</span>
            <span>•</span>
            <span>{data.view_count} views</span>
            <span>•</span>
            <span>{data.fork_count} forks</span>
            <span>•</span>
            <span>{new Date(data.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </button>
            {data.allow_forking && (
              <button
                type="button"
                onClick={handleFork}
                disabled={isForking}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-60"
              >
                {isForking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GitFork className="h-4 w-4" />
                )}
                Fork This Journey
              </button>
            )}
            <Link
              to="/"
              className="inline-flex items-center text-sm px-3 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              Open VentureBot
            </Link>
          </div>
        </header>

        <section className="space-y-3">
          {data.messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isSystem = message.role === 'system';
            return (
              <article
                key={message.id || `${message.role}-${index}`}
                className={`rounded-xl border px-4 py-3 ${
                  isSystem
                    ? 'bg-amber-50 border-amber-200'
                    : isUser
                      ? 'bg-white border-neutral-300'
                      : 'bg-primary-50 border-primary-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {isSystem ? 'System' : isUser ? 'Founder' : 'VentureBot'}
                  </p>
                  {message.created_at && (
                    <p className="text-xs text-neutral-400">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                  {message.content}
                </p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default SharedConversation;
