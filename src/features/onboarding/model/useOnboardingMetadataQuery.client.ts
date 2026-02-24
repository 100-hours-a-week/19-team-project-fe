'use client';

import { useQuery } from '@tanstack/react-query';

import { getOnboardingMetadata } from '../api/getOnboardingMetadata';

export const onboardingMetadataQueryKey = ['onboarding', 'metadata'] as const;

type UseOnboardingMetadataQueryOptions = {
  enabled?: boolean;
};

export function useOnboardingMetadataQuery(options: UseOnboardingMetadataQueryOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: onboardingMetadataQueryKey,
    queryFn: getOnboardingMetadata,
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
