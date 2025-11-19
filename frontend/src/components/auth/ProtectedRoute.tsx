import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useAgent } from '../../contexts/AgentContext';
import { useProgress } from '../../contexts/ProgressContext';
import { Spinner } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
  fallback
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: projectLoading } = useProject();
  const { isLoading: agentLoading } = useAgent();
  const { isLoading: progressLoading } = useProgress();
  const location = useLocation();

  // Coordinate all loading states
  const isLoading = authLoading || projectLoading || agentLoading || progressLoading;

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-neutral-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
