import { useState, useRef, useEffect, useCallback } from 'react';
import { useAgent } from '../../contexts/AgentContext';
import { useProject } from '../../contexts/ProjectContext';
import { useStreamingChat } from '../../hooks/useStreamingChat';
import { Celebration } from '../ui';
import { cn } from '../../utils/cn';
import { PhaseProgress, type Progress } from './PhaseProgress';
import { AgentHeader } from './AgentHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
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

// Initial greeting message
const GREETING =
  "Hi! I'm VentureBot, your entrepreneurship coach. I'll help you turn everyday frustrations into real business ideas. Let's discover what problems you're passionate about solving. What's your name?";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const { currentAgent, switchAgent } = useAgent();
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

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoStarted = useRef(false);
  const hasGreeted = useRef(false);
  const hasLoadedHistory = useRef(false);
  const prevMilestonesRef = useRef<string[]>([]);

  // Auto-start with Onboarding agent on first visit
  useEffect(() => {
    if (!currentAgent && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      switchAgent('onboarding');
    }
  }, [currentAgent, switchAgent]);

  // Create a session if we don't have one
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;

    try {
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
    } catch (err) {
      console.error('Session creation failed:', err);
      throw err;
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

  // Handle sending a message with streaming response
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

  const handleCopyLog = useCallback(() => {
    alert('Chat log copied to clipboard!');
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)}>
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
