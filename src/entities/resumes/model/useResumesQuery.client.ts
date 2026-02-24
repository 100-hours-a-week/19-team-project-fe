'use client';

import { useQuery } from '@tanstack/react-query';

import { getResumes } from '../api/getResumes';

export const resumesQueryKey = ['resumes'] as const;

type UseResumesQueryOptions = {
  enabled?: boolean;
};

export function useResumesQuery(options: UseResumesQueryOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: resumesQueryKey,
    queryFn: getResumes,
    enabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}
