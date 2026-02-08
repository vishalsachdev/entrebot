import { useState, useRef, useEffect, useCallback } from 'react';
import { useAgent } from '../../contexts/AgentContext';
import { useProject } from '../../contexts/ProjectContext';
import { useStreamingChat } from '../../hooks/useStreamingChat';
import { Celebration, Toast } from '../ui';
import type { ToastType } from '../ui/Toast';
import { cn } from '../../utils/cn';
import { PhaseProgress, type Progress } from './PhaseProgress';
import { AgentHeader, type CopyFormat } from './AgentHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { Message } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Map frontend agent IDs to backend agent names
const agentIdToBackendName: Record<string, string> = {
  onboarding: 'onboarding',
  'idea-generator': 'ideaGenerator',
  validator: 'validator',
  builder: 'builder',
};

// Initial greeting message
const GREETING =
  "Hi! I'm VentureBot, your entrepreneurship coach. I'll help you turn everyday frustrations into real business ideas. Let's discover what problems you're passionate about solving. What's your name?";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const { currentAgent, switchAgent, onAgentSwitch } = useAgent();
  const { currentProject } = useProject();
  const { streamMessage, isStreaming, abortStream } = useStreamingChat();

  // State
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSwitchingAgent, setIsSwitchingAgent] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    title: string;
    message?: string;
  }>({ show: false, type: 'info', title: '' });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoStarted = useRef(false);
  const hasGreeted = useRef(false);
  const hasLoadedHistory = useRef(false);
  const prevMilestonesRef = useRef<string[]>([]);
  // Track completed message IDs to prevent duplicate processing
  const completedMessageIds = useRef<Set<string>>(new Set());
  // Guard against concurrent session creation (race condition)
  const sessionPromiseRef = useRef<Promise<string> | null>(null);

  // Auto-start with Onboarding agent on first visit
  useEffect(() => {
    if (!currentAgent && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      switchAgent('onboarding');
    }
  }, [currentAgent, switchAgent]);

  // Create a session if we don't have one
  // Uses ref-based deduplication to prevent race conditions between
  // greeting storage and first user message
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;

    // If a session creation is already in flight, reuse it
    if (sessionPromiseRef.current) return sessionPromiseRef.current;

    const createSession = async (): Promise<string> => {
      const userEmail = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!).email
        : 'demo@example.com';
      const userName = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!).name
        : 'Demo User';

      const userResponse = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: userName }),
      });
      const userData = await userResponse.json();

      let userId: string;
      if (userData.success && userData.data?.id) {
        userId = userData.data.id;
      } else {
        userId = userEmail;
      }

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
        localStorage.setItem('venturebot_session_id', newSessionId);
        return newSessionId;
      }
      throw new Error(data.error || 'Failed to create session');
    };

    try {
      sessionPromiseRef.current = createSession();
      const result = await sessionPromiseRef.current;
      return result;
    } catch (err) {
      console.error('Session creation failed:', err);
      throw err;
    } finally {
      sessionPromiseRef.current = null;
    }
  }, [sessionId, currentProject?.id, currentAgent?.id]);

  // Load existing session and history from localStorage
  useEffect(() => {
    if (hasLoadedHistory.current) return;
    hasLoadedHistory.current = true;

    const loadHistory = async () => {
      const savedSessionId = localStorage.getItem('venturebot_session_id');

      if (savedSessionId) {
        setSessionId(savedSessionId);
        try {
          const [historyResponse, progressResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/chat/history/${savedSessionId}`),
            fetch(`${API_BASE_URL}/chat/progress/${savedSessionId}`),
          ]);

          const historyData = await historyResponse.json();
          const progressData = await progressResponse.json();

          if (historyData.success && historyData.messages?.length > 0) {
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

            if (loadedMessages[0]?.role === 'user') {
              loadedMessages.unshift({
                id: `msg-greeting-restored`,
                role: 'assistant',
                content: GREETING,
                agentId: 'onboarding',
                timestamp: new Date(
                  new Date(loadedMessages[0].timestamp).getTime() - 1000
                ),
                status: 'delivered',
              });
            }

            setMessages(loadedMessages);
            hasGreeted.current = true;
          }

          if (progressData.success) {
            setProgress(progressData);
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
  useEffect(() => {
    if (isLoadingHistory) return;
    if (
      currentAgent?.id === 'onboarding' &&
      messages.length === 0 &&
      !isTyping &&
      !hasGreeted.current
    ) {
      hasGreeted.current = true;
      const greetingMessage: Message = {
        id: `msg-greeting-${Date.now()}`,
        role: 'assistant',
        content: GREETING,
        agentId: 'onboarding',
        timestamp: new Date(),
        status: 'delivered',
      };
      setMessages([greetingMessage]);
      setTimeout(() => inputRef.current?.focus(), 100);

      // Store greeting in database
      (async () => {
        try {
          const sid = await ensureSession();
          await fetch(`${API_BASE_URL}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sid,
              role: 'assistant',
              content: GREETING,
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Detect new milestones and trigger celebration
  useEffect(() => {
    if (!progress?.milestones) return;

    const currentMilestones = progress.milestones;
    const previousMilestones = prevMilestonesRef.current;
    const newMilestones = currentMilestones.filter(
      m => !previousMilestones.includes(m)
    );

    if (newMilestones.length > 0 && previousMilestones.length > 0) {
      setCelebration({ show: true, milestone: newMilestones[0] });
    }

    prevMilestonesRef.current = currentMilestones;
  }, [progress?.milestones]);

  // Listen for agent switches and add transition messages
  useEffect(() => {
    const unsubscribe = onAgentSwitch((fromAgent, toAgent) => {
      // Skip transition message on initial agent set (when fromAgent is null)
      // or when starting a new chat (messages will be reset anyway)
      if (!fromAgent || messages.length === 0) return;

      // Show loading state briefly
      setIsSwitchingAgent(true);

      // Add transition message to chat
      const transitionMessage: Message = {
        id: `msg-transition-${Date.now()}`,
        role: 'system',
        content: `Switched to ${toAgent.name}`,
        timestamp: new Date(),
        status: 'delivered',
        metadata: {
          isTransition: true,
          fromAgent: fromAgent.name,
          toAgent: toAgent.name,
        },
      };

      setMessages(prev => [...prev, transitionMessage]);

      // Clear loading state after a brief delay
      setTimeout(() => {
        setIsSwitchingAgent(false);
        inputRef.current?.focus();
      }, 300);
    });

    return unsubscribe;
  }, [onAgentSwitch, messages.length]);

  // Handle sending a message with streaming response
  const handleSend = useCallback(async () => {
    if (!input.trim() || !currentAgent || isStreaming || isSwitchingAgent)
      return;

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

      const streamingMsgId = `msg-streaming-${Date.now()}`;
      setStreamingMessageId(streamingMsgId);
      setStreamingContent('');

      const placeholderMessage: Message = {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        agentId: currentAgent.id,
        timestamp: new Date(),
        status: 'sending',
      };
      setMessages(prev => [...prev, placeholderMessage]);

      await streamMessage({
        sessionId: currentSessionId,
        message: messageText,
        agent: backendAgentName,
        onChunk: (_chunk, fullContent) => {
          setStreamingContent(fullContent);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === streamingMsgId ? { ...msg, content: fullContent } : msg
            )
          );
        },
        onComplete: async (fullContent, responseAgent) => {
          // Guard against duplicate completion calls
          if (completedMessageIds.current.has(streamingMsgId)) {
            return;
          }
          completedMessageIds.current.add(streamingMsgId);

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
    isSwitchingAgent,
    streamMessage,
    streamingMessageId,
    ensureSession,
  ]);

  // Handle stopping the stream
  const handleStopStreaming = useCallback(() => {
    abortStream();

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

  // Handle new chat
  const handleNewChat = useCallback(() => {
    localStorage.removeItem('venturebot_session_id');
    setSessionId(null);
    setProgress(null);
    hasLoadedHistory.current = true;
    setIsLoadingHistory(false);
    hasGreeted.current = true;

    setMessages([
      {
        id: `msg-greeting-${Date.now()}`,
        role: 'assistant',
        content: GREETING,
        agentId: 'onboarding',
        timestamp: new Date(),
        status: 'delivered',
      },
    ]);

    switchAgent('onboarding');
  }, [switchAgent]);

  // Handle copy log with toast notification
  const handleCopyLog = useCallback(
    (format: CopyFormat) => {
      const formatLabel = format === 'json' ? 'JSON' : 'plain text';
      setToast({
        show: true,
        type: 'success',
        title: 'Chat log copied!',
        message: `${messages.length} messages copied as ${formatLabel}`,
      });
    },
    [messages.length]
  );

  // Helper to show toast notifications
  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      setToast({ show: true, type, title, message });
    },
    []
  );

  // Close toast handler
  const handleCloseToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  // Handle editing a message
  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      // Update message in local state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                content: newContent,
                isEdited: true,
                editedAt: new Date(),
                originalContent: msg.originalContent || msg.content,
              }
            : msg
        )
      );

      // Optionally persist to backend (if we have the API endpoint)
      if (sessionId) {
        try {
          await fetch(`${API_BASE_URL}/conversations/${messageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: newContent,
              metadata: { edited: true, editedAt: new Date().toISOString() },
            }),
          });
        } catch (err) {
          // Silently fail - edit is still saved locally
          console.error('Failed to persist message edit:', err);
        }
      }

      showToast('success', 'Message updated');
    },
    [sessionId, showToast]
  );

  // Handle deleting a message
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      // Optionally persist to backend (if we have the API endpoint)
      if (sessionId) {
        try {
          await fetch(`${API_BASE_URL}/conversations/${messageId}`, {
            method: 'DELETE',
          });
        } catch (err) {
          // Silently fail - deletion is still done locally
          console.error('Failed to persist message deletion:', err);
        }
      }

      showToast('info', 'Message deleted');
    },
    [sessionId, showToast]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={handleCloseToast}
        duration={3000}
      />

      {/* Milestone Celebration */}
      <Celebration
        show={celebration?.show ?? false}
        milestone={celebration?.milestone ?? ''}
        onComplete={() => setCelebration(null)}
      />

      {/* Journey Progress */}
      <PhaseProgress progress={progress} />

      {/* Chat Header */}
      {currentAgent && (
        <AgentHeader
          agent={currentAgent}
          messages={messages}
          sessionId={sessionId}
          onCopyLog={handleCopyLog}
          onNewChat={handleNewChat}
        />
      )}

      {/* Messages */}
      <MessageList
        ref={messagesEndRef}
        messages={messages}
        currentAgent={currentAgent}
        streamingMessageId={streamingMessageId}
        isTyping={isTyping}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
      />

      {/* Input */}
      {currentAgent && (
        <ChatInput
          ref={inputRef}
          agent={currentAgent}
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onStop={handleStopStreaming}
          isTyping={isTyping}
          isStreaming={isStreaming}
        />
      )}
    </div>
  );
};

export default ChatInterface;
