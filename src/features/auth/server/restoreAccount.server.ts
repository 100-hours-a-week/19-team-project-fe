import { restoreAccount as restoreAccountApi } from '@/shared/api/server';

type RestoreAccountPayload = {
  oauth_provider: 'KAKAO';
  oauth_id: string;
  email: string;
  nickname: string;
};

type RestoreAccountResult = {
  userId: number;
  userType: string;
  accessToken: string;
  refreshToken: string;
};

export async function restoreAccount(
  payload: RestoreAccountPayload,
): Promise<RestoreAccountResult> {
  const response = await restoreAccountApi(payload);
  return {
    userId: response.user_id,
    userType: response.user_type,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  };
}
