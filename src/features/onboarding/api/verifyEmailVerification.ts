import { apiFetch, buildApiUrl } from '@/shared/api';

const EMAIL_VERIFICATION_PATH = '/api/v1/email-verifications/public';

type VerifyEmailVerificationRequest = {
  email: string;
  code: string;
};

type VerifyEmailVerificationResponse = {
  email: string;
  verified_at: string;
};

export async function verifyEmailVerification(payload: VerifyEmailVerificationRequest) {
  return apiFetch<VerifyEmailVerificationResponse>(buildApiUrl(EMAIL_VERIFICATION_PATH), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['OK'],
  });
}
