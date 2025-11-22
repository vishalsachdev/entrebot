import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/api';
import type { DbUser, CreateUserRequest, UpdateUserRequest } from '../../types';

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: { limit?: number; offset?: number }) =>
    [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  byEmail: (email: string) => [...userKeys.all, 'email', email] as const,
};

// Queries
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getUser(userId),
    enabled: !!userId,
  });
};

export const useUserByEmail = (email: string) => {
  return useQuery({
    queryKey: userKeys.byEmail(email),
    queryFn: () => userService.getUserByEmail(email),
    enabled: !!email,
  });
};

export const useUsers = (limit = 50, offset = 0) => {
  return useQuery({
    queryKey: userKeys.list({ limit, offset }),
    queryFn: () => userService.listUsers(limit, offset),
  });
};

// Mutations
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) =>
      userService.createUser(data.email, data),
    onSuccess: (newUser) => {
      // Invalidate and refetch user lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      // Add the new user to the cache
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UpdateUserRequest }) =>
      userService.updateUser(userId, updates),
    onMutate: async ({ userId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<DbUser>(userKeys.detail(userId));

      // Optimistically update to the new value
      if (previousUser) {
        queryClient.setQueryData<DbUser>(userKeys.detail(userId), {
          ...previousUser,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousUser };
    },
    onError: (_err, { userId }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUser);
      }
    },
    onSettled: (_data, _error, { userId }) => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: (_, userId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};
