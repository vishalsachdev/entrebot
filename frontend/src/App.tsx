import { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, AppContextProvider } from './contexts';
import { ProtectedRoute } from './components/auth';
import { AppShell } from './components/layout';
import { ContextErrorBoundary } from './components/ContextErrorBoundary';

// Eager load auth pages for better UX
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

// Lazy load all other pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const Agents = lazy(() => import('./pages/Agents'));
const Progress = lazy(() => import('./pages/Progress'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const ComponentDemo = lazy(() => import('./pages/ComponentDemo'));
const SharedConversation = lazy(() => import('./pages/SharedConversation'));

// Simple loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContextErrorBoundary>
        <Router>
          <AuthProvider>
            <AppContextProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route
                  path="/register"
                  element={<Navigate to="/login" replace />}
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/shared/:shareId"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <SharedConversation />
                    </Suspense>
                  }
                />

                {/* Protected Routes with AppShell - wrapped in Suspense for lazy loading */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Suspense fallback={<PageLoader />}>
                          <Dashboard />
                        </Suspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Suspense fallback={<PageLoader />}>
                          <Projects />
                        </Suspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/agents"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Suspense fallback={<PageLoader />}>
                          <Agents />
                        </Suspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Suspense fallback={<PageLoader />}>
                          <Progress />
                        </Suspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Suspense fallback={<PageLoader />}>
                          <History />
                        </Suspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Suspense fallback={<PageLoader />}>
                          <Settings />
                        </Suspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/components"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Suspense fallback={<PageLoader />}>
                          <ComponentDemo />
                        </Suspense>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AppContextProvider>
          </AuthProvider>
        </Router>
      </ContextErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
