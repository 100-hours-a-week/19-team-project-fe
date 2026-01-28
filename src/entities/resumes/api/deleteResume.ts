import { apiFetch } from '@/shared/api';

export async function deleteResume(resumeId: number): Promise<void> {
  await apiFetch(`/bff/resumes/${resumeId}`, {
    method: 'DELETE',
    successCodes: ['OK'],
  });
}
