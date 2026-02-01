import { apiFetch } from '@/shared/api';

export type UpdateResumeTitlePayload = {
  title: string;
};

export async function updateResumeTitle(
  resumeId: number,
  payload: UpdateResumeTitlePayload,
): Promise<void> {
  await apiFetch(`/bff/resumes/${resumeId}/title`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    successCodes: ['OK'],
  });
}
