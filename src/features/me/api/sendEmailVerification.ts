import { apiFetch } from '@/shared/api';

const EMAIL_VERIFICATION_PATH = '/bff/email-verifications';

type SendEmailVerificationRequest = {
  email: string;
};

type SendEmailVerificationResponse = {
  email: string;
  expires_at?: string;
};

export async function sendMyPageEmailVerification(payload: SendEmailVerificationRequest) {
  return apiFetch<SendEmailVerificationResponse>(EMAIL_VERIFICATION_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['OK'],
  });
}
