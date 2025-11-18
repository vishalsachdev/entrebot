import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../../services/api';
import type { DbConversation } from '../../types';

// Query Keys
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (sessionId: string, limit?: number, offset?: number) =>
    [...conversationKeys.lists(), sessionId, { limit, offset }] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  summary: (sessionId: string) =>
    [...conversationKeys.all, 'summary', sessionId] as const,
  search: (sessionId: string, query: string) =>
    [...conversationKeys.all, 'search', sessionId, query] as const,
};

// Queries
export const useConversationHistory = (
  sessionId: string,
  limit = 100,
  offset = 0
) => {
  return useQuery({
    queryKey: conversationKeys.list(sessionId, limit, offset),
    queryFn: () => conversationService.getConversationHistory(sessionId, limit, offset),
    enabled: !!sessionId,
  });
};

export const useConversationSummary = (
  sessionId: string,
  firstN = 5,
  lastN = 10
) => {
  return useQuery({
    queryKey: conversationKeys.summary(sessionId),
    queryFn: () => conversationService.getConversationSummary(sessionId, firstN, lastN),
    enabled: !!sessionId,
  });
};

export const useMessage = (messageId: string) => {
  return useQuery({
    queryKey: conversationKeys.detail(messageId),
    queryFn: () => conversationService.getMessage(messageId),
    enabled: !!messageId,
  });
};

export const useSearchMessages = (sessionId: string, query: string, limit = 20) => {
  return useQuery({
    queryKey: conversationKeys.search(sessionId, query),
    queryFn: () => conversationService.searchMessages(sessionId, query, limit),
    enabled: !!sessionId && !!query,
  });
};

// Mutations
export const useAddMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      role,
      content,
      metadata,
    }: {
      sessionId: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      metadata?: Record<string, any>;
    }) => conversationService.addMessage(sessionId, role, content, metadata),
    onMutate: async ({ sessionId, role, content, metadata }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.list(sessionId),
      });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<DbConversation[]>(
        conversationKeys.list(sessionId)
      );

      // Optimistically add the new message
      if (previousMessages) {
        const optimisticMessage: DbConversation = {
          id: `temp-${Date.now()}`,
          session_id: sessionId,
          role,
          content,
          metadata,
          created_at: new Date().toISOString(),
        };

        queryClient.setQueryData<DbConversation[]>(
          conversationKeys.list(sessionId),
          [...previousMessages, optimisticMessage]
        );
      }

      return { previousMessages };
    },
    onError: (err, { sessionId }, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          conversationKeys.list(sessionId),
          context.previousMessages
        );
      }
    },
    onSuccess: (newMessage, { sessionId }) => {
      // Update with real message from server
      queryClient.invalidateQueries({
        queryKey: conversationKeys.list(sessionId),
      });
      queryClient.setQueryData(conversationKeys.detail(newMessage.id), newMessage);
    },
  });
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      updates,
    }: {
      messageId: string;
      updates: { content?: string; metadata?: Record<string, any> };
    }) => conversationService.updateMessage(messageId, updates),
    onMutate: async ({ messageId, updates }) => {
      await queryClient.cancelQueries({
        queryKey: conversationKeys.detail(messageId),
      });

      const previousMessage = queryClient.getQueryData<DbConversation>(
        conversationKeys.detail(messageId)
      );

      if (previousMessage) {
        queryClient.setQueryData<DbConversation>(
          conversationKeys.detail(messageId),
          {
            ...previousMessage,
            ...updates,
          }
        );
      }

      return { previousMessage };
    },
    onError: (err, { messageId }, context) => {
      if (context?.previousMessage) {
        queryClient.setQueryData(
          conversationKeys.detail(messageId),
          context.previousMessage
        );
      }
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: conversationKeys.detail(data.id),
        });
        queryClient.invalidateQueries({
          queryKey: conversationKeys.list(data.session_id),
        });
      }
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => conversationService.deleteMessage(messageId),
    onSuccess: (_, messageId) => {
      queryClient.removeQueries({ queryKey: conversationKeys.detail(messageId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};
