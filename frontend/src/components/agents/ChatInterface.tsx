import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { Button, Textarea, Card } from '../ui';
import { cn } from '../../utils/cn';
import type { Message } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Map frontend agent IDs to backend agent names
const agentIdToBackendName: Record<string, string> = {
  'onboarding': 'onboarding',
  'idea-generator': 'ideaGenerator',
  'validator': 'validator',
  'builder': 'builder',
  'strategist': 'onboarding',
  'growth-advisor': 'onboarding',
};

interface ChatInterfaceProps {
  className?: string;
}

// Phase configuration matching backend orchestrator
const PHASES = [
  { id: 'discovery', label: 'Discover', icon: '🔍', description: 'Find your pain point' },
  { id: 'ideation', label: 'Ideate', icon: '💡', description: 'Generate solutions' },
  { id: 'validation', label: 'Validate', icon: '✓', description: 'Test assumptions' },
  { id: 'strategy', label: 'Strategy', icon: '📋', description: 'Plan your product' },
  { id: 'building', label: 'Build', icon: '🔨', description: 'Create your MVP' },
  { id: 'launch', label: 'Launch', icon: '🚀', description: 'Go to market' },
  { id: 'growth', label: 'Grow', icon: '📈', description: 'Scale your business' },
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoStarted = useRef(false);

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
            fetch(`${API_BASE_URL}/chat/progress/${savedSessionId}`)
          ]);
          
          const historyData = await historyResponse.json();
          const progressData = await progressResponse.json();
          
          console.log('History response:', historyData);
          console.log('Progress response:', progressData);
          
          // Load messages
          if (historyData.success && historyData.messages && historyData.messages.length > 0) {
            const loadedMessages: Message[] = historyData.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              agentId: msg.metadata?.agent || 'onboarding',
              timestamp: new Date(msg.created_at),
              status: 'delivered',
            }));
            
            // Prepend greeting if first message is from user (greeting wasn't stored)
            if (loadedMessages[0]?.role === 'user') {
              const greeting = "Hey there! I'm VentureBot, your entrepreneurship coach. I'm here to help you discover a real problem worth solving and turn it into a business idea. Think of me as your thinking partner - I'll ask questions to help you dig deep and find something meaningful. Let's start simple: what's your name?";
              loadedMessages.unshift({
                id: `msg-greeting-restored`,
                role: 'assistant',
                content: greeting,
                agentId: 'onboarding',
                timestamp: new Date(new Date(loadedMessages[0].timestamp).getTime() - 1000),
                status: 'delivered',
              });
            }
            
            setMessages(loadedMessages);
            hasGreeted.current = true; // Don't show greeting if we have history
            console.log(`Loaded ${loadedMessages.length} messages from history`);
          }
          
          // Load progress
          if (progressData.success) {
            setProgress(progressData);
            console.log(`Loaded progress: phase=${progressData.currentPhase}, ${progressData.milestones?.length || 0} milestones`);
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
    if (currentAgent?.id === 'onboarding' && messages.length === 0 && !isTyping && !hasGreeted.current) {
      hasGreeted.current = true;
      const greeting = "Hey there! I'm VentureBot, your entrepreneurship coach. I'm here to help you discover a real problem worth solving and turn it into a business idea. Think of me as your thinking partner - I'll ask questions to help you dig deep and find something meaningful. Let's start simple: what's your name?";
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
              metadata: { agent: 'Onboarding', isGreeting: true }
            }),
          });
        } catch (err) {
          console.error('Failed to store greeting:', err);
        }
      })();
    }
  }, [currentAgent, messages.length, isTyping, isLoadingHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create a session if we don't have one
  const ensureSession = async (): Promise<string> => {
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

      // Create a session with the user ID
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          metadata: { agent: currentAgent?.id }
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
  };

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
    const messageText = input;
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const currentSessionId = await ensureSession();
      const backendAgentName = agentIdToBackendName[currentAgent.id] || 'ideaGenerator';

      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          message: messageText,
          agent: backendAgentName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const agentMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.response,
          agentId: currentAgent.id,
          timestamp: new Date(),
          status: 'delivered',
          metadata: {
            agent: data.agent || currentAgent.name,
          },
        };
        setMessages((prev) => [...prev, agentMessage]);

        // Update progress from backend response
        if (data.progress) {
          setProgress(data.progress);
        }

        // Auto-switch to Idea Generator when onboarding completes
        if (data.onboardingComplete && currentAgent.id === 'onboarding') {
          // Switch agent immediately (not in setTimeout)
          switchAgent('idea-generator');
          
          // Then generate ideas
          setIsTyping(true);
          try {
            const ideaResponse = await fetch(`${API_BASE_URL}/chat/message`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: currentSessionId,
                message: 'Generate ideas',
                agent: 'ideaGenerator',
              }),
            });
            const ideaData = await ideaResponse.json();
            if (ideaData.success) {
              const ideaMessage: Message = {
                id: `msg-${Date.now() + 3}`,
                role: 'assistant',
                content: ideaData.response,
                agentId: 'idea-generator',
                timestamp: new Date(),
                status: 'delivered',
              };
              setMessages((prev) => [...prev, ideaMessage]);
            }
          } catch (err) {
            console.error('Failed to generate ideas:', err);
          } finally {
            setIsTyping(false);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }

        // Auto-switch to Validator when idea is selected
        // Check from any agent since selection might come while still showing as onboarding
        if (data.ideaSelected) {
          switchAgent('validator');
          
          // Trigger validation
          setIsTyping(true);
          try {
            const validationResponse = await fetch(`${API_BASE_URL}/chat/message`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: currentSessionId,
                message: 'Validate my idea',
                agent: 'validator',
              }),
            });
            const validationData = await validationResponse.json();
            if (validationData.success) {
              const validationMessage: Message = {
                id: `msg-${Date.now() + 4}`,
                role: 'assistant',
                content: validationData.response,
                agentId: 'validator',
                timestamp: new Date(),
                status: 'delivered',
              };
              setMessages((prev) => [...prev, validationMessage]);
            }
          } catch (err) {
            console.error('Failed to validate idea:', err);
          } finally {
            setIsTyping(false);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }

        // Auto-switch back to Idea Generator when user wants new ideas
        if (data.backToIdeas) {
          setTimeout(async () => {
            switchAgent('idea-generator');
            
            // Auto-trigger new idea generation
            setIsTyping(true);
            try {
              const ideaResponse = await fetch(`${API_BASE_URL}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: currentSessionId,
                  message: 'Generate new ideas',
                  agent: 'ideaGenerator',
                }),
              });
              const ideaData = await ideaResponse.json();
              if (ideaData.success) {
                const ideaMessage: Message = {
                  id: `msg-${Date.now() + 5}`,
                  role: 'assistant',
                  content: ideaData.response,
                  agentId: 'idea-generator',
                  timestamp: new Date(),
                  status: 'delivered',
                };
                setMessages((prev) => [...prev, ideaMessage]);
              }
            } catch (err) {
              console.error('Failed to generate new ideas:', err);
            } finally {
              setIsTyping(false);
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }, 1500);
        }

        // Auto-switch to Builder when user wants to proceed from validation
        if (data.proceedToBuild) {
          switchAgent('builder');
          
          const builderMessage: Message = {
            id: `msg-${Date.now() + 6}`,
            role: 'assistant',
            content: "Great! I'm your Builder agent now. I can help you with:\n\n1. Creating a PRD (Product Requirements Document)\n2. Writing landing page copy and code\n3. Planning your MVP build\n4. Customer interview scripts\n\nWhat would you like to start with?",
            agentId: 'builder',
            timestamp: new Date(),
            status: 'delivered',
          };
          setMessages((prev) => [...prev, builderMessage]);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      // Add error message to chat
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Something went wrong'}. Please try again.`,
        agentId: currentAgent.id,
        timestamp: new Date(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      // Focus back on input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

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
      {/* Journey Progress - 7 Phases with Progress Bar */}
      <div className="border-b border-neutral-200 px-4 py-3 bg-gradient-to-r from-primary-50 to-white">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-neutral-600">
              {progress?.phaseName || 'Discovery'}: {progress?.phaseDescription || 'Find your pain point'}
            </span>
            <span className="text-xs font-semibold text-primary-600">{progressPercentage}%</span>
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
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mb-0.5',
                    isCurrent ? 'bg-primary-600 text-white ring-2 ring-primary-300 ring-offset-1' :
                    isCompleted ? 'bg-primary-200 text-primary-700' : 'bg-neutral-200 text-neutral-400'
                  )}>
                    {isCompleted ? '✓' : phase.icon}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium whitespace-nowrap',
                    isCurrent ? 'text-primary-700' : isCompleted ? 'text-primary-600' : 'text-neutral-400'
                  )}>
                    {phase.label}
                  </span>
                </div>
                {index < PHASES.length - 1 && (
                  <div className={cn(
                    'w-4 h-0.5 mx-0.5 flex-shrink-0',
                    isCompleted ? 'bg-primary-400' : 'bg-neutral-200'
                  )} />
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
              <span className="truncate max-w-[200px]" title={progress.context.painPoint}>
                💡 {progress.context.painPoint}
              </span>
            )}
            {progress.milestones?.length > 0 && (
              <span className="text-primary-600">
                🏆 {progress.milestones.length} milestone{progress.milestones.length > 1 ? 's' : ''}
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
                const log = messages.map(m => 
                  `[${m.role === 'user' ? 'USER' : 'BOT'}]: ${m.content}`
                ).join('\n\n');
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
                const greeting = "Hey there! I'm VentureBot, your entrepreneurship coach. I'm here to help you discover a real problem worth solving and turn it into a business idea. Think of me as your thinking partner - I'll ask questions to help you dig deep and find something meaningful. Let's start simple: what's your name?";
                setMessages([{
                  id: `msg-greeting-${Date.now()}`,
                  role: 'assistant',
                  content: greeting,
                  agentId: 'onboarding',
                  timestamp: new Date(),
                  status: 'delivered',
                }]);
                
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
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${currentAgent.name}...`}
              rows={1}
              className="resize-none"
              disabled={isTyping}
              autoFocus
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
