import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User as UserIcon } from 'lucide-react';
import { Card, MarkdownRenderer } from '../ui';
import { cn } from '../../utils/cn';
import type { Message, Agent } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentAgent: Agent | null;
  streamingMessageId: string | null;
  isTyping: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, currentAgent, streamingMessageId, isTyping }, ref) => {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
        {/* Empty state with agent */}
        {messages.length === 0 && currentAgent && (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-primary-700" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Start a conversation with {currentAgent.name}
            </h3>
            <p className="text-neutral-600 max-w-md mx-auto">
              {currentAgent.description}
            </p>
          </div>
        )}

        {/* Empty state without agent */}
        {!currentAgent && (
          <div className="text-center py-12">
            <p className="text-neutral-600">
              Select an agent to start chatting
            </p>
          </div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-700" />
                </div>
              )}

              <Card
                className={cn(
                  'max-w-[70%]',
                  message.role === 'user'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white'
                )}
                padding="sm"
              >
                {message.role === 'assistant' ? (
                  <div className="text-sm text-neutral-900">
                    <MarkdownRenderer content={message.content} />
                    {/* Show cursor while streaming this message */}
                    {message.id === streamingMessageId && (
                      <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-0.5" />
                    )}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-white">
                    {message.content}
                  </p>
                )}
                <p
                  className={cn(
                    'text-xs mt-1',
                    message.role === 'user'
                      ? 'text-primary-100'
                      : 'text-neutral-500'
                  )}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </Card>

              {message.role === 'user' && (
                <div className="h-8 w-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-4 w-4 text-neutral-700" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator - only when waiting for first chunk */}
        {isTyping && !streamingMessageId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary-700" />
            </div>
            <Card className="bg-white" padding="sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" />
                <span
                  className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Scroll anchor */}
        <div ref={ref} />
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';

export default MessageList;
