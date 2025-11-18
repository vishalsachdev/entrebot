import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function AppTest() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="p-8">
          <h1 className="text-3xl font-bold">VentureBot Test</h1>
          <p>If you see this, the basic setup works!</p>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default AppTest;
