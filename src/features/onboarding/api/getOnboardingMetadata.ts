import { apiFetch } from '@/shared/api';
import type { OnboardingMetadataResponse } from '@/entities/onboarding';

const ONBOARDING_METADATA_PATH = '/bff/onboarding/metadata';

export async function getOnboardingMetadata(): Promise<OnboardingMetadataResponse> {
  return apiFetch<OnboardingMetadataResponse>(ONBOARDING_METADATA_PATH, {
    successCodes: ['OK'],
  });
}
