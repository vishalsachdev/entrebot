import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, FileText, Users, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface Activity {
  id: string;
  type: 'message' | 'milestone' | 'document' | 'collaboration';
  title: string;
  description: string;
  timestamp: Date;
  agent?: string;
}

interface ActivityTimelineProps {
  activities?: Activity[];
  maxItems?: number;
}

const ActivityTimeline = ({ activities = [], maxItems = 5 }: ActivityTimelineProps) => {
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

  // Mock activities if none provided
  const displayActivities = activities.length > 0 ? activities : [
    {
      id: '1',
      type: 'message' as const,
      title: 'Started conversation with Idea Generator',
      description: 'Discussed sustainable fashion marketplace concept',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      agent: 'Idea Generator',
    },
    {
      id: '2',
      type: 'milestone' as const,
      title: 'Completed Discovery Phase',
      description: 'Identified target market and key competitors',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'document' as const,
      title: 'Generated Business Model Canvas',
      description: 'Created initial business model framework',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
  ];

  const recentActivities = displayActivities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => {
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
                      <span>
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">
                    {activity.description}
                  </p>
                  {activity.agent && (
                    <Badge variant="secondary" size="sm">
                      {activity.agent}
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}

          {recentActivities.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
