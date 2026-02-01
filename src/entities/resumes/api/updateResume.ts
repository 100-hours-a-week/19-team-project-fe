import { apiFetch } from '@/shared/api';

export type UpdateResumeCareer = {
  company_name: string;
  job: string;
  position: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

export type UpdateResumeProject = {
  title: string;
  start_date: string;
  end_date: string;
  description: string;
};

export type UpdateResumePayload = {
  title: string;
  is_fresher: boolean;
  education_level: string;
  content_json: {
    careers: UpdateResumeCareer[];
    projects: UpdateResumeProject[];
  };
};

export async function updateResume(resumeId: number, payload: UpdateResumePayload): Promise<void> {
  await apiFetch<null>(`/bff/resumes/${resumeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['OK'],
  });
}
