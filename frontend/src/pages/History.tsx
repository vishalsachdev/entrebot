import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  MessageSquare,
  Calendar,
  ChevronRight,
  Loader2,
  Trash2,
  Bot,
} from 'lucide-react';
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
} from '../components/ui';
import { cn } from '../utils/cn';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface Session {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata: {
    agent?: string;
  };
  messageCount?: number;
  lastMessage?: string;
  progress?: {
    currentPhase: string;
    phaseName: string;
  };
}

const History = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // Get user email from localStorage
      const userEmail = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!).email
        : 'demo@example.com';

      // Fetch sessions for this user
      const response = await fetch(
        `${API_BASE_URL}/sessions?email=${encodeURIComponent(userEmail)}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        // Sort by updated_at descending
        const sortedSessions = data.data.sort(
          (a: Session, b: Session) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        // Set sessions immediately without extra API calls
        // Progress/count will be fetched lazily or shown as defaults
        setSessions(sortedSessions);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = (sessionId: string) => {
    // Save session ID to localStorage and navigate to agents page
    localStorage.setItem('venturebot_session_id', sessionId);
    navigate('/agents');
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      // For now, just remove from local state
      // TODO: Add backend endpoint to delete session
      setSessions(sessions.filter(s => s.id !== sessionId));

      // If this was the current session, clear it
      if (localStorage.getItem('venturebot_session_id') === sessionId) {
        localStorage.removeItem('venturebot_session_id');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const currentSessionId = localStorage.getItem('venturebot_session_id');

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Conversation History"
          description="View and continue your past conversations"
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-red-600">{error}</p>
              <Button onClick={loadSessions} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center">
                  <HistoryIcon className="h-8 w-8 text-neutral-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No conversations yet
              </h3>
              <p className="text-neutral-600 max-w-md mx-auto mb-4">
                Start a conversation with VentureBot to see your history here.
              </p>
              <Button onClick={() => navigate('/agents')}>
                Start Chatting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={cn(
                    'cursor-pointer hover:border-primary-300 transition-all',
                    currentSessionId === session.id &&
                      'border-primary-500 bg-primary-50'
                  )}
                  onClick={() => loadSession(session.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-neutral-900 truncate">
                              Session from{' '}
                              {new Date(
                                session.created_at
                              ).toLocaleDateString()}
                            </h3>
                            {currentSessionId === session.id && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-neutral-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(session.updated_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {session.metadata?.agent || 'onboarding'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => deleteSession(session.id, e)}
                          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete conversation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <ChevronRight className="h-5 w-5 text-neutral-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Container>
  );
};

export default History;
