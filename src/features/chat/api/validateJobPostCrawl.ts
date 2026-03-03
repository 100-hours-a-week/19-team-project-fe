import { apiFetch, readAccessToken } from '@/shared/api';

const JOB_POST_VALIDATE_PATH = '/bff/job-posts/validate';

export interface JobPostCrawlValidationResult {
  crawlable: boolean;
  source?: string;
  http_status?: number;
  reason_code?: string;
  message?: string;
  job_post_id?: number;
  title?: string;
  company?: string;
}

export async function validateJobPostCrawl(url: string): Promise<JobPostCrawlValidationResult> {
  const accessToken = readAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return apiFetch<JobPostCrawlValidationResult>(JOB_POST_VALIDATE_PATH, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });
}
