import { apiFetch, buildApiUrl } from '@/shared/api';

const EMAIL_VERIFICATION_PATH = '/api/v1/email-verifications/public';

type SendEmailVerificationRequest = {
  email: string;
};

type SendEmailVerificationResponse = {
  email: string;
  expires_at: string;
  sent_count: number;
  remaining_attempts: number;
};

export async function sendEmailVerification(payload: SendEmailVerificationRequest) {
  return apiFetch<SendEmailVerificationResponse>(buildApiUrl(EMAIL_VERIFICATION_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['OK'],
  });
}
