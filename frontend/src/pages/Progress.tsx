import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, Award, Target, Loader2, AlertCircle } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { apiClient } from '../services/api';
import {
  Container,
  PageHeader,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '../components/ui';
import {
  PhaseCard,
  ProgressTracker,
  MilestoneCard,
} from '../components/progress';

// Session ID storage key (matches ChatContext)
const SESSION_ID_KEY = 'entrebot_session_id';

// API response types
interface ProgressResponse {
  success: boolean;
  currentPhase: string;
  phaseName: string;
  phaseDescription: string;
  progress: {
    percentage: number;
    completedPhases: string[];
    currentPhase: string;
    remainingPhases: string[];
  };
  milestones: string[];
  context: {
    userName?: string;
    painPoint?: string;
    selectedIdea?: string;
    validated?: boolean;
  };
  startedAt?: string;
  lastActivity?: string;
}

const Progress = () => {
  const {
    allPhases,
    currentPhase,
    milestones,
    overallProgress,
    setCurrentPhase,
    completeMilestone,
    getPhaseProgress,
    updatePhaseStatus,
    addMilestone,
  } = useProgress();

  // API state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiProgress, setApiProgress] = useState<ProgressResponse | null>(null);

  // Refs to avoid stale closures in effect
  const allPhasesRef = useRef(allPhases);
  const milestonesRef = useRef(milestones);
  allPhasesRef.current = allPhases;
  milestonesRef.current = milestones;

  // Memoize helper functions
  const formatMilestoneName = useCallback((id: string): string => {
    return id
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  const getMilestoneDescription = useCallback((id: string): string => {
    const descriptions: Record<string, string> = {
      name_collected: 'Introduced yourself to the coaching system',
      pain_articulated: 'Clearly defined your pain point or problem',
      pain_validated: 'Validated the importance of your pain point',
      ideas_generated: 'Generated business ideas based on your pain point',
      idea_selected: 'Selected an idea to pursue',
      validation_complete: 'Completed market validation research',
      decision_made: 'Made a go/no-go decision on your idea',
      prd_created: 'Created a product requirements document',
      mvp_scoped: 'Defined the scope of your MVP',
      prompts_generated: 'Generated AI prompts for building',
      mvp_started: 'Started building your MVP',
      mvp_complete: 'Completed your MVP',
      launch_plan_created: 'Created your launch plan',
      launched: 'Launched your product',
      first_user: 'Got your first user',
      first_feedback: 'Received first user feedback',
      iteration_complete: 'Completed first iteration based on feedback',
    };
    return descriptions[id] || 'Milestone achieved';
  }, []);

  // Fetch progress data from API
  useEffect(() => {
    const fetchProgress = async () => {
      const sessionId = localStorage.getItem(SESSION_ID_KEY);

      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch progress (phases endpoint not needed since we use context)
        const progressRes = await apiClient.get<ProgressResponse>(
          `/chat/progress/${sessionId}`
        );

        setApiProgress(progressRes);

        // Sync API data with context using refs to avoid stale closures
        if (progressRes.currentPhase) {
          const completedPhases = progressRes.progress.completedPhases || [];
          const currentPhaseId = progressRes.currentPhase;

          // Update all phases status
          allPhasesRef.current.forEach(phase => {
            if (completedPhases.includes(phase.id)) {
              updatePhaseStatus(phase.id, 'completed');
            } else if (phase.id === currentPhaseId) {
              updatePhaseStatus(phase.id, 'in_progress');
            }
          });

          // Set current phase
          const matchingPhase = allPhasesRef.current.find(
            p => p.id === currentPhaseId
          );
          if (matchingPhase) {
            setCurrentPhase(matchingPhase);
          }

          // Add milestones from API
          if (progressRes.milestones) {
            progressRes.milestones.forEach(milestoneId => {
              const existingMilestone = milestonesRef.current.find(
                m => m.id === milestoneId
              );
              if (!existingMilestone) {
                addMilestone({
                  id: milestoneId,
                  name: formatMilestoneName(milestoneId),
                  description: getMilestoneDescription(milestoneId),
                  completed: true,
                  completedAt: new Date(),
                  phase: currentPhaseId,
                  priority: 'medium',
                });
              } else if (!existingMilestone.completed) {
                completeMilestone(milestoneId);
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
        setError('Failed to load progress data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [
    setCurrentPhase,
    updatePhaseStatus,
    addMilestone,
    completeMilestone,
    formatMilestoneName,
    getMilestoneDescription,
  ]);

  // Calculate stats from API or fallback to context
  const completedMilestones =
    apiProgress?.milestones?.length ??
    milestones.filter(m => m.completed).length;
  const completedPhasesCount =
    apiProgress?.progress?.completedPhases?.length ??
    allPhases.filter(p => p.status === 'completed').length;
  const progressPercentage =
    apiProgress?.progress?.percentage ?? overallProgress;

  // Loading state
  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-neutral-600">Loading your progress...</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Journey Progress"
          description="Track your entrepreneurship journey through all phases"
        />

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Context info from API */}
        {apiProgress?.context?.userName && (
          <Card className="mb-6 bg-primary-50 border-primary-200">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-4">
                {apiProgress.context.userName && (
                  <div>
                    <span className="text-sm text-primary-700 font-medium">
                      Entrepreneur:
                    </span>{' '}
                    <span className="text-primary-900">
                      {apiProgress.context.userName}
                    </span>
                  </div>
                )}
                {apiProgress.context.painPoint && (
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-primary-700 font-medium">
                      Focus:
                    </span>{' '}
                    <span className="text-primary-900 truncate">
                      {apiProgress.context.painPoint}
                    </span>
                  </div>
                )}
                {apiProgress.context.selectedIdea && (
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-primary-700 font-medium">
                      Idea:
                    </span>{' '}
                    <span className="text-primary-900 truncate">
                      {apiProgress.context.selectedIdea}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Stats */}
        <Grid cols={3} gap={6} className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <CardTitle>Overall Progress</CardTitle>
                  <CardDescription>Across all phases</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-600">
                  {progressPercentage}%
                </span>
              </div>
              <div className="mt-3 w-full bg-neutral-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-2 rounded-full bg-primary-600"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <CardTitle>Phases Completed</CardTitle>
                  <CardDescription>Out of 7 total phases</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-green-600">
                  {completedPhasesCount}
                </span>
                <span className="text-neutral-600">/ 7</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-accent-700" />
                </div>
                <div>
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>Achievements unlocked</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-accent-600">
                  {completedMilestones}
                </span>
                <span className="text-neutral-600">
                  / {milestones.length || completedMilestones}
                </span>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Progress Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Journey Timeline</CardTitle>
            <CardDescription>
              Your progress through the 7-phase entrepreneurship journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8">
              <ProgressTracker variant="horizontal" />
            </div>
          </CardContent>
        </Card>

        {/* Current Phase */}
        {currentPhase && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Current Phase
              </h2>
              <Badge variant="primary">Active</Badge>
            </div>
            <PhaseCard
              phase={currentPhase}
              index={allPhases.findIndex(p => p.id === currentPhase.id)}
              isActive
              progress={getPhaseProgress(currentPhase.id)}
            />
          </div>
        )}

        {/* All Phases */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            All Phases
          </h2>
          <Grid cols={2} gap={6}>
            {allPhases.map((phase, index) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={index}
                isActive={currentPhase?.id === phase.id}
                progress={getPhaseProgress(phase.id)}
                onClick={() => setCurrentPhase(phase)}
              />
            ))}
          </Grid>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Milestones
            </h2>
            <div className="space-y-3">
              {milestones.map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onComplete={() => completeMilestone(milestone.id)}
                />
              ))}
            </div>
          </div>
        )}

        {milestones.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center">
                  <Award className="h-8 w-8 text-neutral-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                No milestones yet
              </h3>
              <p className="text-neutral-600 max-w-md mx-auto">
                Start working on your projects to unlock milestones and track
                your progress.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Container>
  );
};

export default Progress;
