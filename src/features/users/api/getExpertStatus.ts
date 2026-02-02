import { apiFetch } from '@/shared/api';

export type ExpertStatus = {
  verified: boolean;
  verified_at: string | null;
  company_name: string | null;
  company_email: string | null;
};

export async function getExpertStatus(): Promise<ExpertStatus> {
  return apiFetch<ExpertStatus>('/bff/users/me/expert-status');
}
