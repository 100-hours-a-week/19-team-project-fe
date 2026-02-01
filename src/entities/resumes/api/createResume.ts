import { apiFetch } from '@/shared/api';

export type CreateResumePayload = {
  title: string;
  is_fresher: boolean;
  education_level: string;
  file_url: string | null;
  content_json: Record<string, unknown>;
};

export type CreateResumeResponse = {
  resumeId: number;
};

export async function createResume(payload: CreateResumePayload): Promise<CreateResumeResponse> {
  return apiFetch<CreateResumeResponse>('/bff/resumes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    successCodes: ['CREATED', 'OK'],
  });
}
