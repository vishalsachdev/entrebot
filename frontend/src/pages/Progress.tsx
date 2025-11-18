import { motion } from 'framer-motion';
import { TrendingUp, Award, Target } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
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
import { PhaseCard, ProgressTracker, MilestoneCard } from '../components/progress';

const Progress = () => {
  const {
    allPhases,
    currentPhase,
    milestones,
    overallProgress,
    setCurrentPhase,
    completeMilestone,
    getPhaseProgress,
  } = useProgress();

  const completedMilestones = milestones.filter((m) => m.completed).length;
  const completedPhases = allPhases.filter((p) => p.status === 'completed').length;

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
                  {overallProgress}%
                </span>
              </div>
              <div className="mt-3 w-full bg-neutral-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
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
                  {completedPhases}
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
                <span className="text-neutral-600">/ {milestones.length}</span>
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
              index={allPhases.findIndex((p) => p.id === currentPhase.id)}
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
              {milestones.map((milestone) => (
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
                Start working on your projects to unlock milestones and track your progress.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Container>
  );
};

export default Progress;
