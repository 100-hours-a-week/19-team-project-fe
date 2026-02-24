'use client';

import { useQuery } from '@tanstack/react-query';

import { getReports } from '../api/getReports';

export const reportsQueryKey = ['reports'] as const;

type UseReportsQueryOptions = {
  enabled?: boolean;
};

export function useReportsQuery(options: UseReportsQueryOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: reportsQueryKey,
    queryFn: getReports,
    enabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}
