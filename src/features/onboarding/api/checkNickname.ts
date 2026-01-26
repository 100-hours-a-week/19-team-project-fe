import { BusinessError, HttpError, buildApiUrl } from '@/shared/api';
import type { ApiResponse } from '@/shared/api/types';

type NicknameCheckResponse = {
  nickname: string;
  exists: boolean;
  available: boolean;
};

const NICKNAME_CHECK_PATH = '/api/v1/users';

export async function checkNickname(nickname: string): Promise<NicknameCheckResponse> {
  const url = buildApiUrl(`${NICKNAME_CHECK_PATH}?nickname=${encodeURIComponent(nickname)}`);
  const res = await fetch(url, { credentials: 'include' });

  let body: ApiResponse<NicknameCheckResponse> | null = null;
  try {
    body = (await res.json()) as ApiResponse<NicknameCheckResponse>;
  } catch {
    body = null;
  }

  if (body && typeof body.code === 'string') {
    if (body.code === 'OK' || body.code === 'SUCCESS' || body.code === 'CREATED') {
      return body.data;
    }
    throw new BusinessError(body.code, body.message, body.data);
  }

  if (!res.ok) {
    throw new HttpError(res.status, res.statusText, res.url);
  }

  throw new Error('Invalid response');
}
