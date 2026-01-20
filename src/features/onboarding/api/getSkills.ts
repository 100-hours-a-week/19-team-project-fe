import { apiFetch, buildApiUrl } from '@/shared/api';
import type { SkillsResponse } from '@/entities/onboarding';

const SKILLS_PATH = '/api/v1/skills';

export async function getSkills(): Promise<SkillsResponse> {
  const url = buildApiUrl(SKILLS_PATH);
  return apiFetch<SkillsResponse>(url, { successCodes: ['OK'] });
}
