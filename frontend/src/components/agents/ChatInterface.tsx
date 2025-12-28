import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bot, User as UserIcon, Square } from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { useProject } from '../../contexts/ProjectContext';
import { useStreamingChat } from '../../hooks/useStreamingChat';
import { Button, Textarea, Card, MarkdownRenderer, Celebration } from '../ui';
import { cn } from '../../utils/cn';
import type { Message } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Map frontend agent IDs to backend agent names
const agentIdToBackendName: Record<string, string> = {
  onboarding: 'onboarding',
  'idea-generator': 'ideaGenerator',
  validator: 'validator',
  builder: 'builder',
  strategist: 'onboarding',
  'growth-advisor': 'onboarding',
};

interface ChatInterfaceProps {
  className?: string;
}

// Phase configuration matching backend orchestrator
const PHASES = [
  {
    id: 'discovery',
    label: 'Discover',
    icon: '🔍',
    description: 'Find your pain point',
  },
  {
    id: 'ideation',
    label: 'Ideate',
    icon: '💡',
    description: 'Generate solutions',
  },
  {
    id: 'validation',
    label: 'Validate',
    icon: '✓',
    description: 'Test assumptions',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: '📋',
    description: 'Plan your product',
  },
  {
    id: 'building',
    label: 'Build',
    icon: '🔨',
    description: 'Create your MVP',
  },
  { id: 'launch', label: 'Launch', icon: '🚀', description: 'Go to market' },
  {
    id: 'growth',
    label: 'Grow',
    icon: '📈',
    description: 'Scale your business',
  },
];

interface Progress {
  currentPhase: string;
  phaseName: string;
  phaseDescription: string;
  progress: {
    percentage: number;
    completedPhases: string[];
    remainingPhases: string[];
  };
  milestones: string[];
  context: {
    userName?: string;
    painPoint?: string;
    selectedIdea?: string;
  };
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const { currentAgent, switchAgent } = useAgent();
  const { currentProject } = useProject();
  const { streamMessage, isStreaming, abortStream } = useStreamingChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [celebration, setCelebration] = useState<{
    show: boolean;
    milestone: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoStarted = useRef(false);
  const prevMilestonesRef = useRef<string[]>([]);

  // Auto-start with Onboarding agent on first visit
  useEffect(() => {
    if (!currentAgent && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      switchAgent('onboarding');
    }
  }, [currentAgent, switchAgent]);

  // Refs for tracking state
  const hasGreeted = useRef(false);
  const hasLoadedHistory = useRef(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load existing session and history from localStorage
  useEffect(() => {
    if (hasLoadedHistory.current) return;
    hasLoadedHistory.current = true;

    const loadHistory = async () => {
      // Check for existing session in localStorage
      const savedSessionId = localStorage.getItem('venturebot_session_id');
      console.log('Checking for saved session:', savedSessionId);

      if (savedSessionId) {
        setSessionId(savedSessionId);
        try {
          // Load conversation history and progress in parallel
          const [historyResponse, progressResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/chat/history/${savedSessionId}`),
            fetch(`${API_BASE_URL}/chat/progress/${savedSessionId}`),
          ]);

          const historyData = await historyResponse.json();
          const progressData = await progressResponse.json();

          console.log('History response:', historyData);
          console.log('Progress response:', progressData);

          // Load messages
          if (
            historyData.success &&
            historyData.messages &&
            historyData.messages.length > 0
          ) {
            interface HistoryMessage {
              id: string;
              role: 'user' | 'assistant' | 'system';
              content: string;
              metadata?: { agent?: string };
              created_at: string;
            }
            const loadedMessages: Message[] = historyData.messages.map(
              (msg: HistoryMessage) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                agentId: msg.metadata?.agent || 'onboarding',
                timestamp: new Date(msg.created_at),
                status: 'delivered',
              })
            );

            // Prepend greeting if first message is from user (greeting wasn't stored)
            if (loadedMessages[0]?.role === 'user') {
              const greeting =
                "Hi! I'm VentureBot, your entrepreneurship coach. I'll help you turn everyday frustrations into real business ideas. Let's discover what problems you're passionate about solving. What's your name?";
              loadedMessages.unshift({
                id: `msg-greeting-restored`,
                role: 'assistant',
                content: greeting,
                agentId: 'onboarding',
                timestamp: new Date(
                  new Date(loadedMessages[0].timestamp).getTime() - 1000
                ),
                status: 'delivered',
              });
            }

            setMessages(loadedMessages);
            hasGreeted.current = true; // Don't show greeting if we have history
            console.log(
              `Loaded ${loadedMessages.length} messages from history`
            );
          }

          // Load progress
          if (progressData.success) {
            setProgress(progressData);
            console.log(
              `Loaded progress: phase=${progressData.currentPhase}, ${progressData.milestones?.length || 0} milestones`
            );
          }
        } catch (err) {
          console.error('Failed to load history:', err);
        }
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, []);

  // Auto-greet when onboarding agent is active and no messages yet
  // Wait for history loading to complete first
  useEffect(() => {
    if (isLoadingHistory) return; // Wait for history check to complete
    if (
      currentAgent?.id === 'onboarding' &&
      messages.length === 0 &&
      !isTyping &&
      !hasGreeted.current
    ) {
      hasGreeted.current = true;
      const greeting =
        "Hi! I'm VentureBot, your entrepreneurship coach. I'll help you turn everyday frustrations into real business ideas. Let's discover what problems you're passionate about solving. What's your name?";
      const greetingMessage: Message = {
        id: `msg-greeting-${Date.now()}`,
        role: 'assistant',
        content: greeting,
        agentId: 'onboarding',
        timestamp: new Date(),
        status: 'delivered',
      };
      setMessages([greetingMessage]);
      setTimeout(() => inputRef.current?.focus(), 100);

      // Store greeting in database so backend knows about it
      (async () => {
        try {
          const sid = await ensureSession();
          await fetch(`${API_BASE_URL}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sid,
              role: 'assistant',
              content: greeting,
              metadata: { agent: 'Onboarding', isGreeting: true },
            }),
          });
        } catch (err) {
          console.error('Failed to store greeting:', err);
        }
      })();
    }
  }, [
    currentAgent,
    messages.length,
    isTyping,
    isLoadingHistory,
    ensureSession,
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Detect new milestones and trigger celebration
  useEffect(() => {
    if (!progress?.milestones) return;

    const currentMilestones = progress.milestones;
    const previousMilestones = prevMilestonesRef.current;

    // Find new milestones that weren't in the previous list
    const newMilestones = currentMilestones.filter(
      milestone => !previousMilestones.includes(milestone)
    );

    // Trigger celebration for the first new milestone
    if (newMilestones.length > 0 && previousMilestones.length > 0) {
      // Only celebrate if we had previous milestones (not initial load)
      setCelebration({ show: true, milestone: newMilestones[0] });
    }

    // Update the ref with current milestones
    prevMilestonesRef.current = currentMilestones;
  }, [progress?.milestones]);

  // Handle celebration completion
  const handleCelebrationComplete = useCallback(() => {
    setCelebration(null);
  }, []);

  // Create a session if we don't have one
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;

    try {
      // Get user email from localStorage or use demo
      const userEmail = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!).email
        : 'demo@example.com';
      const userName = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!).name
        : 'Demo User';

      // Create user and get their UUID
      const userResponse = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: userName }),
      });
      const userData = await userResponse.json();

      // Get user ID from response (new user) or error means user exists
      let userId: string;
      if (userData.success && userData.data?.id) {
        userId = userData.data.id;
      } else {
        // User might already exist, try to get their ID by creating session with email
        // The backend will handle this gracefully
        userId = userEmail;
      }

      // Create a session with the user ID and current project
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          projectId: currentProject?.id || null,
          metadata: { agent: currentAgent?.id },
        }),
      });

      const data = await response.json();
      if (data.success && data.data?.id) {
        const newSessionId = data.data.id;
        setSessionId(newSessionId);
        // Save to localStorage for persistence
        localStorage.setItem('venturebot_session_id', newSessionId);
        console.log('Created new session:', newSessionId);
        return newSessionId;
      }
      throw new Error(data.error || 'Failed to create session');
    } catch (err) {
      console.error('Session creation failed:', err);
      throw err;
    }
  }, [sessionId, currentProject?.id, currentAgent?.id]);

  /**
   * Handle sending a message with streaming response
   */
  const handleSend = useCallback(async () => {
    if (!input.trim() || !currentAgent || isStreaming) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const currentSessionId = await ensureSession();
      const backendAgentName =
        agentIdToBackendName[currentAgent.id] || 'ideaGenerator';

      // Create a placeholder message for streaming
      const streamingMsgId = `msg-streaming-${Date.now()}`;
      setStreamingMessageId(streamingMsgId);
      setStreamingContent('');

      // Add placeholder message to messages list
      const placeholderMessage: Message = {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        agentId: currentAgent.id,
        timestamp: new Date(),
        status: 'sending',
      };
      setMessages(prev => [...prev, placeholderMessage]);

      // Stream the response
      await streamMessage({
        sessionId: currentSessionId,
        message: messageText,
        agent: backendAgentName,
        onChunk: (_chunk, fullContent) => {
          setStreamingContent(fullContent);
          // Update the placeholder message with accumulated content
          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMsgId ? { ...msg, content: fullContent } : msg
            )
          );
        },
        onComplete: async (fullContent, responseAgent) => {
          // Finalize the message
          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMsgId
                ? {
                    ...msg,
                    content: fullContent,
                    status: 'delivered',
                    metadata: { agent: responseAgent },
                  }
                : msg
            )
          );
          setStreamingMessageId(null);
          setStreamingContent('');
          setIsTyping(false);

          // Fetch progress after streaming completes
          try {
            const progressResponse = await fetch(
              `${API_BASE_URL}/chat/progress/${currentSessionId}`
            );
            const progressData = await progressResponse.json();
            if (progressData.success) {
              setProgress(progressData);
            }
          } catch (err) {
            console.error('Failed to fetch progress:', err);
          }

          setTimeout(() => inputRef.current?.focus(), 100);
        },
        onError: errorMessage => {
          // Update placeholder with error
          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMsgId
                ? {
                    ...msg,
                    content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
                    status: 'error',
                  }
                : msg
            )
          );
          setStreamingMessageId(null);
          setStreamingContent('');
          setIsTyping(false);
          setError(errorMessage);
          setTimeout(() => inputRef.current?.focus(), 100);
        },
      });
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMsg);

      // Add error message if streaming failed to start
      if (!streamingMessageId) {
        const errorMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
          agentId: currentAgent.id,
          timestamp: new Date(),
          status: 'error',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [
    input,
    currentAgent,
    isStreaming,
    streamMessage,
    streamingMessageId,
    ensureSession,
  ]);

  /**
   * Handle stopping the stream
   */
  const handleStopStreaming = useCallback(() => {
    abortStream();

    // Finalize the streaming message with current content
    if (streamingMessageId) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === streamingMessageId
            ? {
                ...msg,
                status: 'delivered',
                content: streamingContent || msg.content,
              }
            : msg
        )
      );
      setStreamingMessageId(null);
      setStreamingContent('');
    }

    setIsTyping(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [abortStream, streamingMessageId, streamingContent]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get current phase from progress or default to discovery
  const currentPhase = progress?.currentPhase || 'discovery';
  const completedPhases = progress?.progress?.completedPhases || [];
  const progressPercentage = progress?.progress?.percentage || 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Milestone Celebration */}
      <Celebration
        show={celebration?.show ?? false}
        milestone={celebration?.milestone ?? ''}
        onComplete={handleCelebrationComplete}
      />

      {/* Journey Progress - 7 Phases with Progress Bar */}
      <div className="border-b border-neutral-200 px-4 py-3 bg-gradient-to-r from-primary-50 to-white">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-neutral-600">
              {progress?.phaseName || 'Discovery'}:{' '}
              {progress?.phaseDescription || 'Find your pain point'}
            </span>
            <span className="text-xs font-semibold text-primary-600">
              {progressPercentage}%
            </span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Phase Steps */}
        <div className="flex items-center justify-between overflow-x-auto pb-1">
          {PHASES.map((phase, index) => {
            const isCompleted = completedPhases.includes(phase.id);
            const isCurrent = currentPhase === phase.id;

            return (
              <div key={phase.id} className="flex items-center flex-shrink-0">
                <div
                  className={cn(
                    'flex flex-col items-center px-1.5 py-1 rounded-lg transition-all',
                    isCurrent && 'bg-primary-50'
                  )}
                  title={phase.description}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mb-0.5',
                      isCurrent
                        ? 'bg-primary-600 text-white ring-2 ring-primary-300 ring-offset-1'
                        : isCompleted
                          ? 'bg-primary-200 text-primary-700'
                          : 'bg-neutral-200 text-neutral-400'
                    )}
                  >
                    {isCompleted ? '✓' : phase.icon}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium whitespace-nowrap',
                      isCurrent
                        ? 'text-primary-700'
                        : isCompleted
                          ? 'text-primary-600'
                          : 'text-neutral-400'
                    )}
                  >
                    {phase.label}
                  </span>
                </div>
                {index < PHASES.length - 1 && (
                  <div
                    className={cn(
                      'w-4 h-0.5 mx-0.5 flex-shrink-0',
                      isCompleted ? 'bg-primary-400' : 'bg-neutral-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Context Summary (if available) */}
        {progress?.context?.userName && (
          <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-4 text-xs text-neutral-500">
            <span>👤 {progress.context.userName}</span>
            {progress.context.painPoint && (
              <span
                className="truncate max-w-[200px]"
                title={progress.context.painPoint}
              >
                💡 {progress.context.painPoint}
              </span>
            )}
            {progress.milestones?.length > 0 && (
              <span className="text-primary-600">
                🏆 {progress.milestones.length} milestone
                {progress.milestones.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

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
            <button
              onClick={() => {
                // Copy chat log to clipboard
                const log = messages
                  .map(
                    m => `[${m.role === 'user' ? 'USER' : 'BOT'}]: ${m.content}`
                  )
                  .join('\n\n');
                navigator.clipboard.writeText(log);
                alert('Chat log copied to clipboard!');
              }}
              className="text-xs px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
            >
              Copy Log
            </button>
            <button
              onClick={() => {
                // Clear session and start fresh
                localStorage.removeItem('venturebot_session_id');
                setSessionId(null);
                setProgress(null); // Reset progress
                hasLoadedHistory.current = true;
                setIsLoadingHistory(false);

                // Set greeting directly instead of relying on effect
                hasGreeted.current = true;
                const greeting =
                  "Hi! I'm VentureBot, your entrepreneurship coach. I'll help you turn everyday frustrations into real business ideas. Let's discover what problems you're passionate about solving. What's your name?";
                setMessages([
                  {
                    id: `msg-greeting-${Date.now()}`,
                    role: 'assistant',
                    content: greeting,
                    agentId: 'onboarding',
                    timestamp: new Date(),
                    status: 'delivered',
                  },
                ]);

                switchAgent('onboarding');
              }}
              className="text-xs px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
            >
              New Chat
            </button>
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

        {/* Show typing indicator only when waiting for first chunk (not during streaming) */}
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {currentAgent && (
        <div className="border-t border-neutral-200 p-4 bg-white">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${currentAgent.name}...`}
              rows={1}
              className="resize-none"
              disabled={isTyping}
              autoFocus
            />
            {isStreaming ? (
              <Button
                onClick={handleStopStreaming}
                variant="secondary"
                className="flex-shrink-0"
                title="Stop generating"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
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
            )}
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
