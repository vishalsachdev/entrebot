import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AuthProvider,
  ProjectProvider,
  AgentProvider,
  ProgressProvider,
} from './contexts';
import { ProtectedRoute } from './components/auth';
import { AppShell } from './components/layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Agents from './pages/Agents';
import Progress from './pages/Progress';
import History from './pages/History';
import Settings from './pages/Settings';
import ComponentDemo from './pages/ComponentDemo';

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
      <Router>
        <AuthProvider>
          <ProjectProvider>
            <AgentProvider>
              <ProgressProvider>
                <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes with AppShell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Projects />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Agents />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Progress />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <History />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Settings />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/components"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ComponentDemo />
                  </AppShell>
                </ProtectedRoute>
              }
            />
                </Routes>
              </ProgressProvider>
            </AgentProvider>
          </ProjectProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;