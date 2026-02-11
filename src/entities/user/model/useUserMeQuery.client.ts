'use client';

import { useQuery } from '@tanstack/react-query';

import { getUserMe } from '../api/getUserMe';

type UseUserMeQueryOptions = {
  enabled?: boolean;
};

export function useUserMeQuery(options: UseUserMeQueryOptions = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: getUserMe,
    enabled,
    staleTime: 30_000,
  });
}
