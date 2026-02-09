import { apiFetch, buildApiUrl } from '@/shared/api';
import type { OnboardingMetadataResponse } from '@/entities/onboarding';

const ONBOARDING_METADATA_PATH = '/app/bff/onboarding/metadata';

export async function getOnboardingMetadata(): Promise<OnboardingMetadataResponse> {
  const url = buildApiUrl(ONBOARDING_METADATA_PATH);
  return apiFetch<OnboardingMetadataResponse>(url, { successCodes: ['OK'] });
}
