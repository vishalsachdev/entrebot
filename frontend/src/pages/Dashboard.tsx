import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Grid,
  PageHeader,
  Container,
} from '../components/ui';
import { ProjectSwitcher } from '../components/projects';
import { ActivityTimeline, NextSteps, RecommendationCard } from '../components/coaching';
import { Rocket, Lightbulb, Target, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects, currentProject } = useProject();

  const quickActions = [
    {
      title: 'Validate Idea',
      description: 'Get AI feedback on your business concept',
      icon: Lightbulb,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      path: '/validate',
    },
    {
      title: 'Generate PRD',
      description: 'Create a product requirements document',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/prd',
    },
    {
      title: 'Start Project',
      description: 'Begin a new entrepreneurship journey',
      icon: Rocket,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/projects/new',
    },
    {
      title: 'Track Progress',
      description: 'View your journey milestones',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      path: '/progress',
    },
  ];

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title={`Welcome back, ${user?.name}!`}
          description="Your AI-powered entrepreneurship coaching platform"
          actions={projects.length > 0 ? <ProjectSwitcher /> : undefined}
        />

        {/* Current Project Info */}
        {currentProject && (
          <Card className="mb-8 bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {currentProject.name}
                    </h3>
                    <Badge variant="success">Active Project</Badge>
                  </div>
                  <p className="text-neutral-700 mb-3">
                    {currentProject.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-neutral-600">Phase: </span>
                      <span className="font-medium text-neutral-900">
                        {currentProject.currentPhase.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-600">Progress: </span>
                      <span className="font-medium text-neutral-900">
                        {currentProject.progress}%
                      </span>
                    </div>
                  </div>
                </div>
                <Link to="/projects">
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h2>
          <Grid cols={4} gap={4}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link to={action.path}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="pt-6">
                        <div
                          className={cn(
                            'h-12 w-12 rounded-lg flex items-center justify-center mb-4',
                            action.bgColor
                          )}
                        >
                          <Icon className={cn('h-6 w-6', action.color)} />
                        </div>
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {action.title}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </Grid>
        </div>

        {/* Status Cards */}
        <Grid cols={3} gap={6}>
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>Your current ventures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {projects.filter((p) => p.status === 'active').length}
              </div>
              <p className="text-sm text-neutral-600">
                {projects.length === 0
                  ? 'No projects yet'
                  : `${projects.length} total project${projects.length !== 1 ? 's' : ''}`}
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/projects">
                <Button size="sm">
                  {projects.length === 0 ? 'Start New Project' : 'View Projects'}
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journey Progress</CardTitle>
              <CardDescription>Your entrepreneurship path</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-secondary-600">0</span>
                <span className="text-neutral-600">/ 7 phases</span>
              </div>
              <p className="text-sm text-neutral-600">
                Start your first project to begin
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="neutral">Not Started</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Achievements unlocked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent-600 mb-2">0</div>
              <p className="text-sm text-neutral-600">
                Complete tasks to earn milestones
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/history">
                <Button size="sm" variant="ghost">
                  View History
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </Grid>

        {/* Coaching Sections */}
        <Grid cols={2} gap={6} className="mt-8">
          <div className="space-y-6">
            <NextSteps />
            <ActivityTimeline />
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>
                  Personalized suggestions based on your progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <RecommendationCard
                    recommendation={{
                      id: '1',
                      title: 'Talk to the Validator Agent',
                      description: 'Get expert feedback on your business concept',
                      reasoning: 'You\'ve completed the Discovery phase and are ready for validation',
                      priority: 'high',
                      expectedOutcome: 'Identify potential risks and validate market demand',
                      actionLabel: 'Start Validation',
                      actionPath: '/agents',
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to make the most of your coaching experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    'Create your first project and define your business idea',
                    'Work with AI agents to validate and refine your concept',
                    'Generate a comprehensive product requirements document',
                    'Track your progress through the 7-phase journey',
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-neutral-700 pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Grid>
      </motion.div>
    </Container>
  );
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default Dashboard;
