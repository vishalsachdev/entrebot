import { motion } from 'framer-motion';
import { Container, PageHeader } from '../components/ui';
import { AgentSwitcher, ChatInterface } from '../components/agents';

const Agents = () => {
  return (
    <Container size="full" className="h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="h-full flex flex-col"
      >
        <PageHeader
          title="AI Agents"
          description="Chat with specialized AI agents to guide your entrepreneurship journey"
          actions={<AgentSwitcher />}
        />

        <div className="flex-1 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <ChatInterface />
        </div>
      </motion.div>
    </Container>
  );
};

export default Agents;
