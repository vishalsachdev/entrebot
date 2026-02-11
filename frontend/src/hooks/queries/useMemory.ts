import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoryService } from '../../services/api';

// Query Keys
export const memoryKeys = {
  all: ['memory'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (sessionId: string) => [...memoryKeys.lists(), sessionId] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (sessionId: string, key: string) =>
    [...memoryKeys.details(), sessionId, key] as const,
};

// Queries
export const useMemory = (sessionId: string, key: string) => {
  return useQuery({
    queryKey: memoryKeys.detail(sessionId, key),
    queryFn: () => memoryService.getMemory(sessionId, key),
    enabled: !!sessionId && !!key,
  });
};

export const useMemoryObject = (sessionId: string, key: string) => {
  return useQuery({
    queryKey: memoryKeys.detail(sessionId, key),
    queryFn: () => memoryService.getMemoryObject(sessionId, key),
    enabled: !!sessionId && !!key,
  });
};

export const useAllMemory = (sessionId: string) => {
  return useQuery({
    queryKey: memoryKeys.list(sessionId),
    queryFn: () => memoryService.getAllMemory(sessionId),
    enabled: !!sessionId,
  });
};

// Mutations
export const useSetMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      key,
      value,
    }: {
      sessionId: string;
      key: string;
      value: unknown;
    }) => memoryService.setMemory(sessionId, key, value),
    onMutate: async ({ sessionId, key, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: memoryKeys.detail(sessionId, key),
      });

      // Snapshot previous value
      const previousMemory = queryClient.getQueryData(
        memoryKeys.detail(sessionId, key)
      );

      // Optimistically update
      queryClient.setQueryData(memoryKeys.detail(sessionId, key), value);

      // Update the all memory cache
      const allMemory = queryClient.getQueryData<Record<string, unknown>>(
        memoryKeys.list(sessionId)
      );
      if (allMemory) {
        queryClient.setQueryData(memoryKeys.list(sessionId), {
          ...allMemory,
          [key]: value,
        });
      }

      return { previousMemory };
    },
    onError: (_err, { sessionId, key }, context) => {
      // Rollback on error
      if (context?.previousMemory !== undefined) {
        queryClient.setQueryData(
          memoryKeys.detail(sessionId, key),
          context.previousMemory
        );
      }
    },
    onSettled: (_data, _error, { sessionId, key }) => {
      // Refetch after error or success
      queryClient.invalidateQueries({
        queryKey: memoryKeys.detail(sessionId, key),
      });
      queryClient.invalidateQueries({ queryKey: memoryKeys.list(sessionId) });
    },
  });
};

export const useUpdateMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      key,
      value,
    }: {
      sessionId: string;
      key: string;
      value: unknown;
    }) => memoryService.updateMemory(sessionId, key, value),
    onMutate: async ({ sessionId, key, value }) => {
      await queryClient.cancelQueries({
        queryKey: memoryKeys.detail(sessionId, key),
      });

      const previousMemory = queryClient.getQueryData(
        memoryKeys.detail(sessionId, key)
      );

      queryClient.setQueryData(memoryKeys.detail(sessionId, key), value);

      return { previousMemory };
    },
    onError: (_err, { sessionId, key }, context) => {
      if (context?.previousMemory !== undefined) {
        queryClient.setQueryData(
          memoryKeys.detail(sessionId, key),
          context.previousMemory
        );
      }
    },
    onSettled: (_data, _error, { sessionId, key }) => {
      queryClient.invalidateQueries({
        queryKey: memoryKeys.detail(sessionId, key),
      });
      queryClient.invalidateQueries({ queryKey: memoryKeys.list(sessionId) });
    },
  });
};

export const useDeleteMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, key }: { sessionId: string; key: string }) =>
      memoryService.deleteMemory(sessionId, key),
    onSuccess: (_, { sessionId, key }) => {
      queryClient.removeQueries({
        queryKey: memoryKeys.detail(sessionId, key),
      });
      queryClient.invalidateQueries({ queryKey: memoryKeys.list(sessionId) });
    },
  });
};

export const useClearMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => memoryService.clearMemory(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({ queryKey: memoryKeys.list(sessionId) });
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
    },
  });
};

export const useSetMultipleMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: Record<string, unknown>;
    }) => memoryService.setMultipleMemory(sessionId, data),
    onMutate: async ({ sessionId, data }) => {
      await queryClient.cancelQueries({ queryKey: memoryKeys.list(sessionId) });

      const previousMemory = queryClient.getQueryData<Record<string, unknown>>(
        memoryKeys.list(sessionId)
      );

      // Optimistically update all memory
      if (previousMemory) {
        queryClient.setQueryData(memoryKeys.list(sessionId), {
          ...previousMemory,
          ...data,
        });
      }

      return { previousMemory };
    },
    onError: (_err, { sessionId }, context) => {
      if (context?.previousMemory) {
        queryClient.setQueryData(
          memoryKeys.list(sessionId),
          context.previousMemory
        );
      }
    },
    onSettled: (_data, _error, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.list(sessionId) });
    },
  });
};
