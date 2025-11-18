import { motion } from 'framer-motion';
import { History as HistoryIcon } from 'lucide-react';
import {
  Container,
  PageHeader,
  Card,
  CardContent,
} from '../components/ui';

const History = () => {
  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="History"
          description="View your past conversations and interactions"
        />

        {/* Empty State */}
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center">
                <HistoryIcon className="h-8 w-8 text-neutral-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No history yet
            </h3>
            <p className="text-neutral-600 max-w-md mx-auto">
              Your conversation history and agent interactions will appear here
              once you start working on projects.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default History;
