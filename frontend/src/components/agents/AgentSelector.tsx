import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { Modal, ModalFooter, Button, Input, Grid, Badge } from '../ui';
import AgentCard from './AgentCard';

interface AgentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (agentId: string) => void;
  recommendedPhase?: string;
}

const AgentSelector = ({
  isOpen,
  onClose,
  onSelect,
  recommendedPhase,
}: AgentSelectorProps) => {
  const { availableAgents, currentAgent, switchAgent, getRecommendedAgents } = useAgent();
  const [searchQuery, setSearchQuery] = useState('');

  const recommendedAgents = recommendedPhase
    ? getRecommendedAgents(recommendedPhase)
    : [];

  const filteredAgents = availableAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.specialization.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleSelectAgent = (agentId: string) => {
    switchAgent(agentId);
    if (onSelect) {
      onSelect(agentId);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select an AI Agent"
      description="Choose an agent to help you with your entrepreneurship journey"
      size="xl"
    >
      <div className="space-y-4">
        {/* Search */}
        <Input
          placeholder="Search agents by name, specialization, or expertise..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : undefined
          }
        />

        {/* Recommended Agents */}
        {recommendedAgents.length > 0 && !searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-neutral-900">
                Recommended for Current Phase
              </h3>
              <Badge variant="accent" size="sm">
                {recommendedAgents.length}
              </Badge>
            </div>
            <Grid cols={2} gap={4}>
              {recommendedAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={currentAgent?.id === agent.id}
                  isRecommended
                  onClick={() => handleSelectAgent(agent.id)}
                />
              ))}
            </Grid>
          </div>
        )}

        {/* All Agents */}
        <div>
          {!searchQuery && recommendedAgents.length > 0 && (
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              All Agents
            </h3>
          )}
          <AnimatePresence mode="wait">
            {filteredAgents.length > 0 ? (
              <motion.div
                key="agents"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Grid cols={2} gap={4}>
                  {filteredAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isSelected={currentAgent?.id === agent.id}
                      onClick={() => handleSelectAgent(agent.id)}
                    />
                  ))}
                </Grid>
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <p className="text-neutral-600">
                  No agents found matching "{searchQuery}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AgentSelector;
