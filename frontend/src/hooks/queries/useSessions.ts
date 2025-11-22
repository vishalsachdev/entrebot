import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../../services/api';
import type { DbSession } from '../../types';

// Query Keys
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (userId: string, limit?: number) =>
    [...sessionKeys.lists(), userId, { limit }] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  withData: (id: string) => [...sessionKeys.detail(id), 'full'] as const,
};

// Queries
export const useSession = (sessionId: string) => {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => sessionService.getSession(sessionId),
    enabled: !!sessionId,
  });
};

export const useUserSessions = (userId: string, limit = 50) => {
  return useQuery({
    queryKey: sessionKeys.list(userId, limit),
    queryFn: () => sessionService.getUserSessions(userId, limit),
    enabled: !!userId,
  });
};

export const useSessionWithData = (
  sessionId: string,
  includeMessages = true,
  includeMemory = true
) => {
  return useQuery({
    queryKey: sessionKeys.withData(sessionId),
    queryFn: () =>
      sessionService.getSessionWithData(sessionId, includeMessages, includeMemory),
    enabled: !!sessionId,
  });
};

// Mutations
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      metadata,
    }: {
      userId: string;
      metadata?: Record<string, any>;
    }) => sessionService.createSession(userId, metadata),
    onSuccess: (newSession, { userId }) => {
      // Invalidate user sessions list
      queryClient.invalidateQueries({ queryKey: sessionKeys.list(userId) });
      
      // Add to cache
      queryClient.setQueryData(sessionKeys.detail(newSession.id), newSession);
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      metadata,
    }: {
      sessionId: string;
      metadata: Record<string, any>;
    }) => sessionService.updateSession(sessionId, metadata),
    onMutate: async ({ sessionId, metadata }) => {
      await queryClient.cancelQueries({ queryKey: sessionKeys.detail(sessionId) });

      const previousSession = queryClient.getQueryData<DbSession>(
        sessionKeys.detail(sessionId)
      );

      if (previousSession) {
        queryClient.setQueryData<DbSession>(sessionKeys.detail(sessionId), {
          ...previousSession,
          metadata: { ...previousSession.metadata, ...metadata },
          updated_at: new Date().toISOString(),
        });
      }

      return { previousSession };
    },
    onError: (_err, { sessionId }, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(
          sessionKeys.detail(sessionId),
          context.previousSession
        );
      }
    },
    onSettled: (_data, _error, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionService.deleteSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
};
