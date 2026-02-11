/**
 * useStreamingChat Hook
 *
 * Custom hook for managing SSE streaming chat responses.
 * Handles connection, chunk processing, completion, and errors.
 *
 * @module hooks/useStreamingChat
 */

import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Phase transition metadata from backend
 */
export interface PhaseTransition {
  phaseChanged?: boolean;
  phase?: string;
  nextAgent?: string;
  onboardingComplete?: boolean;
  ideaSelected?: boolean;
  proceedToBuild?: boolean;
}

/**
 * SSE chunk data format from backend
 */
interface StreamChunk {
  chunk?: string;
  agent?: string;
  done?: boolean;
  error?: string;
  // Phase transition fields (sent with done event)
  phaseChanged?: boolean;
  phase?: string;
  nextAgent?: string;
  onboardingComplete?: boolean;
  ideaSelected?: boolean;
  proceedToBuild?: boolean;
}

/**
 * Stream message options
 */
interface StreamMessageOptions {
  sessionId: string;
  message: string;
  agent: string;
  onChunk: (chunk: string, fullContent: string) => void;
  onComplete?: (
    fullContent: string,
    agent: string,
    transition?: PhaseTransition
  ) => void;
  onError?: (error: string) => void;
}

/**
 * Hook return type
 */
interface UseStreamingChatReturn {
  streamMessage: (options: StreamMessageOptions) => Promise<string>;
  isStreaming: boolean;
  error: string | null;
  abortStream: () => void;
}

/**
 * Custom hook for streaming chat responses via SSE
 *
 * @returns Object with streamMessage function, isStreaming state, error, and abort function
 *
 * @example
 * const { streamMessage, isStreaming, error, abortStream } = useStreamingChat();
 *
 * await streamMessage({
 *   sessionId: 'session-123',
 *   message: 'Hello',
 *   agent: 'onboarding',
 *   onChunk: (chunk, fullContent) => setContent(fullContent),
 *   onComplete: (content, agent) => console.log('Done:', agent),
 *   onError: (err) => console.error(err)
 * });
 */
export const useStreamingChat = (): UseStreamingChatReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Abort the current streaming request
   */
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  /**
   * Stream a message to the chat backend
   */
  const streamMessage = useCallback(
    async ({
      sessionId,
      message,
      agent,
      onChunk,
      onComplete,
      onError,
    }: StreamMessageOptions): Promise<string> => {
      // Abort any existing stream
      abortStream();

      setIsStreaming(true);
      setError(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let fullContent = '';
      let responseAgent = agent;
      // Guard to ensure onComplete is only called once
      let hasCompleted = false;

      try {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sessionId,
            message,
            agent,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Stream request failed: ${response.status} ${errorText}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages from buffer
          const lines = buffer.split('\n');

          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) {
              continue;
            }

            // Parse SSE data lines
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);

              try {
                const data: StreamChunk = JSON.parse(dataStr);

                // Handle error
                if (data.error) {
                  const errorMessage = data.error;
                  setError(errorMessage);
                  onError?.(errorMessage);
                  reader.cancel();
                  setIsStreaming(false);
                  return fullContent;
                }

                // Handle completion
                if (data.done) {
                  if (!hasCompleted) {
                    hasCompleted = true;
                    const transition: PhaseTransition = {};
                    if (data.phaseChanged) {
                      transition.phaseChanged = data.phaseChanged;
                      transition.phase = data.phase;
                      transition.nextAgent = data.nextAgent;
                      transition.onboardingComplete = data.onboardingComplete;
                      transition.ideaSelected = data.ideaSelected;
                      transition.proceedToBuild = data.proceedToBuild;
                    }
                    onComplete?.(fullContent, responseAgent, transition);
                  }
                  setIsStreaming(false);
                  return fullContent;
                }

                // Handle chunk
                if (data.chunk) {
                  fullContent += data.chunk;
                  if (data.agent) {
                    responseAgent = data.agent;
                  }
                  onChunk(data.chunk, fullContent);
                }
              } catch (parseError) {
                // Skip invalid JSON (might be partial data)
                console.warn('Failed to parse SSE data:', dataStr, parseError);
              }
            }
          }
        }

        // Process any remaining data in buffer
        if (buffer.trim() && buffer.startsWith('data: ')) {
          try {
            const data: StreamChunk = JSON.parse(buffer.slice(6));
            if (data.chunk) {
              fullContent += data.chunk;
              onChunk(data.chunk, fullContent);
            }
            if (data.done && !hasCompleted) {
              hasCompleted = true;
              onComplete?.(fullContent, responseAgent, {});
            }
          } catch {
            // Ignore parse errors for remaining buffer
          }
        }

        setIsStreaming(false);
        // Only call onComplete if it hasn't been called yet
        if (!hasCompleted) {
          hasCompleted = true;
          onComplete?.(fullContent, responseAgent, {});
        }
        return fullContent;
      } catch (err) {
        // Handle abort
        if (err instanceof Error && err.name === 'AbortError') {
          setIsStreaming(false);
          return fullContent;
        }

        const errorMessage =
          err instanceof Error ? err.message : 'Stream failed';
        setError(errorMessage);
        setIsStreaming(false);
        onError?.(errorMessage);
        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [abortStream]
  );

  return {
    streamMessage,
    isStreaming,
    error,
    abortStream,
  };
};

export default useStreamingChat;
