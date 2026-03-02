'use client';

import { useQuery } from '@tanstack/react-query';

import { getAuthStatus } from '../api/getAuthStatus.client';

export type AuthStatusState = 'checking' | 'authed' | 'guest';
export const authStatusQueryKey = ['auth', 'me'] as const;

export function useAuthStatus() {
  const query = useQuery({
    queryKey: authStatusQueryKey,
    queryFn: getAuthStatus,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const status: AuthStatusState = query.isLoading
    ? 'checking'
    : query.data?.authenticated
      ? 'authed'
      : 'guest';

  return {
    status,
    data: query.data,
    refresh: query.refetch,
    isLoading: query.isLoading,
  };
}
