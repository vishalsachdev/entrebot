import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { Modal, ModalFooter, Button, Input, Grid, Badge } from '../ui';
import AgentCard from './AgentCard';

interface AgentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (agentId: string) => void;
  recommendedPhase?: string;
  isLoading?: boolean;
}

const AgentSelector = ({
  isOpen,
  onClose,
  onSelect,
  recommendedPhase,
  isLoading = false,
}: AgentSelectorProps) => {
  const {
    availableAgents,
    currentAgent,
    switchAgent,
    getRecommendedAgents,
    refreshPrerequisites,
  } = useAgent();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);

  // Refresh prerequisites when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshPrerequisites();
      setPendingAgentId(currentAgent?.id || null);
    } else {
      setPendingAgentId(null);
      setSearchQuery('');
    }
  }, [isOpen, currentAgent?.id, refreshPrerequisites]);

  const recommendedAgents = recommendedPhase
    ? getRecommendedAgents(recommendedPhase)
    : [];

  const filteredAgents = availableAgents.filter(
    agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.specialization.some(s =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleClickAgent = (agentId: string) => {
    setPendingAgentId(agentId);
  };

  const handleApply = () => {
    if (!pendingAgentId || pendingAgentId === currentAgent?.id) {
      onClose();
      return;
    }

    switchAgent(pendingAgentId);
    if (onSelect) {
      onSelect(pendingAgentId);
    }
    onClose();
  };

  const pendingAgent = availableAgents.find(a => a.id === pendingAgentId);
  const hasChange = pendingAgentId !== currentAgent?.id;

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
          onChange={e => setSearchQuery(e.target.value)}
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

        {/* Selected Agent Preview */}
        {pendingAgent && hasChange && (
          <div
            className={`border rounded-lg p-3 flex items-center gap-3 ${
              pendingAgent.prerequisitesMet === false
                ? 'bg-amber-50 border-amber-200'
                : 'bg-primary-50 border-primary-200'
            }`}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                pendingAgent.prerequisitesMet === false
                  ? 'bg-amber-100'
                  : 'bg-primary-100'
              }`}
            >
              {pendingAgent.prerequisitesMet === false ? (
                <AlertCircle className="h-4 w-4 text-amber-700" />
              ) : (
                <Check className="h-4 w-4 text-primary-700" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  pendingAgent.prerequisitesMet === false
                    ? 'text-amber-900'
                    : 'text-primary-900'
                }`}
              >
                Selected: {pendingAgent.name}
              </p>
              <p
                className={`text-xs truncate ${
                  pendingAgent.prerequisitesMet === false
                    ? 'text-amber-700'
                    : 'text-primary-700'
                }`}
              >
                {pendingAgent.prerequisitesMet === false &&
                pendingAgent.missingPrerequisites?.[0]
                  ? `Note: ${pendingAgent.missingPrerequisites[0].description}`
                  : 'Click "Apply" to switch agents'}
              </p>
            </div>
          </div>
        )}

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
              {recommendedAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={pendingAgentId === agent.id}
                  isRecommended
                  onClick={() => handleClickAgent(agent.id)}
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
                  {filteredAgents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isSelected={pendingAgentId === agent.id}
                      onClick={() => handleClickAgent(agent.id)}
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
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleApply}
          disabled={isLoading || !pendingAgentId}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Switching...
            </>
          ) : hasChange ? (
            'Apply'
          ) : (
            'Close'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AgentSelector;
