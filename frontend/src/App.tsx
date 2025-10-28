
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Placeholder components for now
const Dashboard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-8"
  >
    <h1 className="text-3xl font-bold text-neutral-900 mb-4">
      VentureBot Dashboard
    </h1>
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Welcome to VentureBot</h2>
      <p className="text-neutral-600">
        Your AI-powered entrepreneurship coaching platform is ready to help you
        build your next venture.
      </p>
      <div className="mt-4 flex gap-2">
        <span className="badge-primary">React 18</span>
        <span className="badge-secondary">TypeScript</span>
        <span className="badge-accent">Tailwind CSS</span>
      </div>
    </div>
  </motion.div>
);

const Login = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="min-h-screen flex items-center justify-center bg-neutral-50"
  >
    <div className="card max-w-md w-full">
      <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="input"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Password
          </label>
          <input
            type="password"
            className="input"
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Sign In
        </button>
      </form>
    </div>
  </motion.div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-neutral-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;