import { apiFetch, buildApiUrl } from '@/shared/api';
import type { CareerLevelsResponse } from '@/entities/onboarding';

const CAREER_LEVELS_PATH = '/api/v1/career-levels';

export async function getCareerLevels(): Promise<CareerLevelsResponse> {
  const url = buildApiUrl(CAREER_LEVELS_PATH);
  return apiFetch<CareerLevelsResponse>(url, { successCodes: ['OK'] });
}
