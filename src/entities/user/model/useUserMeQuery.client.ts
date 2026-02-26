'use client';

import { useQuery } from '@tanstack/react-query';

import { getUserMe } from '../api/getUserMe';

export const userMeQueryKey = ['user', 'me'] as const;

type UseUserMeQueryOptions = {
  enabled?: boolean;
};

export function useUserMeQuery(options: UseUserMeQueryOptions = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: userMeQueryKey,
    queryFn: getUserMe,
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
