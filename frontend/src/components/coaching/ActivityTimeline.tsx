import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  CheckCircle,
  FileText,
  Users,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../ui';
import { cn } from '../../utils/cn';
import { apiClient } from '../../services/api';

interface Activity {
  id: string;
  type: 'message' | 'milestone' | 'document' | 'collaboration';
  title: string;
  description: string;
  timestamp: Date;
  agent?: string;
}

interface ConversationMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    agent?: string;
    phase?: string;
  };
  created_at: string;
}

interface HistoryResponse {
  success: boolean;
  messages: ConversationMessage[];
  count: number;
}

interface ActivityTimelineProps {
  activities?: Activity[];
  sessionId?: string;
  maxItems?: number;
}

// Session ID storage key (matches ChatContext)
const SESSION_ID_KEY = 'venturebot_session_id';

const ActivityTimeline = ({
  activities = [],
  sessionId,
  maxItems = 5,
}: ActivityTimelineProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedActivities, setFetchedActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const iconMap = {
    message: MessageSquare,
    milestone: CheckCircle,
    document: FileText,
    collaboration: Users,
  };

  const colorMap = {
    message: 'text-blue-600 bg-blue-100',
    milestone: 'text-green-600 bg-green-100',
    document: 'text-purple-600 bg-purple-100',
    collaboration: 'text-orange-600 bg-orange-100',
  };

  // Fetch conversation history from API
  useEffect(() => {
    const fetchHistory = async () => {
      // Use provided sessionId or get from localStorage
      const effectiveSessionId =
        sessionId || localStorage.getItem(SESSION_ID_KEY);

      if (!effectiveSessionId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<HistoryResponse>(
          `/chat/history/${effectiveSessionId}?limit=${maxItems * 2}`
        );

        if (response.success && response.messages) {
          // Convert messages to activities
          const convertedActivities: Activity[] = response.messages
            .filter(msg => msg.role !== 'system') // Skip system messages
            .map(msg => ({
              id: msg.id,
              type: 'message' as const,
              title:
                msg.role === 'user'
                  ? 'You sent a message'
                  : `${msg.metadata?.agent || 'AI Coach'} responded`,
              description: truncateText(msg.content, 100),
              timestamp: new Date(msg.created_at),
              agent: msg.metadata?.agent,
            }))
            .slice(0, maxItems);

          setFetchedActivities(convertedActivities);
        }
      } catch (err) {
        console.error('Failed to fetch activity history:', err);
        setError('Failed to load activity');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if no activities provided
    if (activities.length === 0) {
      fetchHistory();
    }
  }, [sessionId, maxItems, activities.length]);

  // Helper to truncate text
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Determine which activities to display
  const displayActivities =
    activities.length > 0 ? activities.slice(0, maxItems) : fetchedActivities;

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity, index) => {
            const Icon = iconMap[activity.type];
            const colorClass = colorMap[activity.type];

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3"
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                    colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-neutral-900">
                      {activity.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-neutral-500 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">
                    {activity.description}
                  </p>
                  {activity.agent && (
                    <Badge variant="secondary" size="sm">
                      {formatAgentName(activity.agent)}
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}

          {displayActivities.length === 0 && !error && (
            <div className="text-center py-8 text-neutral-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">
                Start a chat to see your activity here
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-neutral-500">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper to format timestamp
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Helper to format agent name
const formatAgentName = (name: string): string => {
  // Convert camelCase or snake_case to Title Case with spaces
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default ActivityTimeline;
