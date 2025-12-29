import { forwardRef } from 'react';
import { Send, Loader2, Square } from 'lucide-react';
import { Button, Textarea } from '../ui';
import { cn } from '../../utils/cn';
import type { Agent } from '../../types';

const MAX_CHAR_LIMIT = 2000;
const WARNING_THRESHOLD = 1800; // Show warning at 90% of limit

interface ChatInputProps {
  agent: Agent;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isTyping: boolean;
  isStreaming: boolean;
  disabled?: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    { agent, value, onChange, onSend, onStop, isTyping, isStreaming, disabled },
    ref
  ) => {
    const charCount = value.length;
    const isOverLimit = charCount > MAX_CHAR_LIMIT;
    const isNearLimit = charCount >= WARNING_THRESHOLD;

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isOverLimit) {
          onSend();
        }
      }
    };

    const handleChange = (newValue: string) => {
      // Allow typing but show warning/error state
      onChange(newValue);
    };

    return (
      <div className="border-t border-neutral-200 p-4 bg-white">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={ref}
              value={value}
              onChange={e => handleChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${agent.name}...`}
              rows={1}
              className={cn(
                'resize-none pr-16',
                isOverLimit &&
                  'border-red-500 focus:ring-red-500 focus:border-red-500',
                isNearLimit &&
                  !isOverLimit &&
                  'border-amber-500 focus:ring-amber-500 focus:border-amber-500'
              )}
              disabled={disabled || isTyping}
              autoFocus
            />
            {/* Character counter */}
            <span
              className={cn(
                'absolute right-3 bottom-2 text-xs font-medium',
                isOverLimit && 'text-red-600',
                isNearLimit && !isOverLimit && 'text-amber-600',
                !isNearLimit && 'text-neutral-400'
              )}
            >
              {charCount}/{MAX_CHAR_LIMIT}
            </span>
          </div>
          {isStreaming ? (
            <Button
              onClick={onStop}
              variant="secondary"
              className="flex-shrink-0"
              title="Stop generating"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onSend}
              disabled={!value.trim() || isTyping || isOverLimit}
              className="flex-shrink-0"
              title={isOverLimit ? 'Message too long' : 'Send message'}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-neutral-500">
            Press Enter to send, Shift+Enter for new line
          </p>
          {isOverLimit && (
            <p className="text-xs text-red-600 font-medium">
              Message exceeds character limit
            </p>
          )}
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
