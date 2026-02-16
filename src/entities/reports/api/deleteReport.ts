import { apiFetch } from '@/shared/api';

export async function deleteReport(reportId: number): Promise<Record<string, never>> {
  return apiFetch<Record<string, never>>(`/bff/reports/${reportId}`, { method: 'DELETE' });
}
