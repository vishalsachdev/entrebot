import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { Button, Textarea, Card, Badge } from '../ui';
import { cn } from '../../utils/cn';
import type { Message } from '../../types';

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const { currentAgent } = useAgent();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentAgent) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `This is a simulated response from ${currentAgent.name}. In production, this would be a real AI response based on your message: "${input}"`,
        agentId: currentAgent.id,
        timestamp: new Date(),
        status: 'delivered',
        metadata: {
          agent: currentAgent.name,
        },
      };

      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Chat Header */}
      {currentAgent && (
        <div className="border-b border-neutral-200 p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900">
                {currentAgent.name}
              </h3>
              <p className="text-sm text-neutral-600">
                {currentAgent.personality.tone}
              </p>
            </div>
            <Badge
              variant="success"
              className="bg-green-100 text-green-800"
            >
              Online
            </Badge>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
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

        {!currentAgent && (
          <div className="text-center py-12">
            <p className="text-neutral-600">
              Select an agent to start chatting
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
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
                <p
                  className={cn(
                    'text-sm whitespace-pre-wrap',
                    message.role === 'user' ? 'text-white' : 'text-neutral-900'
                  )}
                >
                  {message.content}
                </p>
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

        {isTyping && (
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {currentAgent && (
        <div className="border-t border-neutral-200 p-4 bg-white">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${currentAgent.name}...`}
              rows={1}
              className="resize-none"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
