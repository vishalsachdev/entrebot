import { useState } from 'react';
import { ChevronDown, Bot } from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { Button, Badge } from '../ui';
import AgentSelector from './AgentSelector';
import { cn } from '../../utils/cn';

interface AgentSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AgentSwitcher = ({ className, size = 'md' }: AgentSwitcherProps) => {
  const { currentAgent } = useAgent();
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <>
      <Button
        variant="secondary"
        size={size}
        onClick={() => setIsOpen(true)}
        className={cn('justify-between', className)}
        rightIcon={<ChevronDown className="h-4 w-4" />}
      >
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <span className={sizeClasses[size]}>
            {currentAgent ? currentAgent.name : 'Select Agent'}
          </span>
          {currentAgent && (
            <Badge
              variant="success"
              size="sm"
              className="bg-green-100 text-green-800"
            >
              Active
            </Badge>
          )}
        </div>
      </Button>

      <AgentSelector isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AgentSwitcher;
