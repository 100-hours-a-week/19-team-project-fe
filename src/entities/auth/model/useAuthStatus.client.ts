'use client';

import { useQuery } from '@tanstack/react-query';

import { getAuthStatus } from '../api/getAuthStatus.client';

export type AuthStatusState = 'checking' | 'authed' | 'guest';

export function useAuthStatus() {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getAuthStatus,
    staleTime: 10_000,
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
