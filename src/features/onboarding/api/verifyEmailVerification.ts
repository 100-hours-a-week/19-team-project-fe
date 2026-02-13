import { apiFetch } from '@/shared/api';

const EMAIL_VERIFICATION_PATH = '/bff/email-verifications/public';

type VerifyEmailVerificationRequest = {
  email: string;
  code: string;
};

type VerifyEmailVerificationResponse = {
  email: string;
  code: string;
};

export async function verifyEmailVerification(payload: VerifyEmailVerificationRequest) {
  return apiFetch<VerifyEmailVerificationResponse>(EMAIL_VERIFICATION_PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['OK'],
  });
}
