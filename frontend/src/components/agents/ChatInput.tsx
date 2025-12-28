import { forwardRef } from 'react';
import { Send, Loader2, Square } from 'lucide-react';
import { Button, Textarea } from '../ui';
import type { Agent } from '../../types';

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
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };

    return (
      <div className="border-t border-neutral-200 p-4 bg-white">
        <div className="flex gap-2">
          <Textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${agent.name}...`}
            rows={1}
            className="resize-none"
            disabled={disabled || isTyping}
            autoFocus
          />
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
              disabled={!value.trim() || isTyping}
              className="flex-shrink-0"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
