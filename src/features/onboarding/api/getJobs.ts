import { apiFetch, buildApiUrl } from '@/shared/api';
import type { JobsResponse } from '@/entities/onboarding';

const JOBS_PATH = '/api/v1/jobs';

export async function getJobs(): Promise<JobsResponse> {
  const url = buildApiUrl(JOBS_PATH);
  return apiFetch<JobsResponse>(url, { successCodes: ['OK'] });
}
