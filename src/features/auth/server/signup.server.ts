import type { SignupRequest } from '@/entities/onboarding';
import { signup as signupApi } from '@/shared/api/server';
import { setAuthCookies } from './setAuthCookies.server';

type SignupResult = {
  userId: number;
};

export async function signup(payload: SignupRequest): Promise<SignupResult> {
  const data = await signupApi(payload);

  await setAuthCookies({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });

  return {
    userId: data.user_id,
  };
}
