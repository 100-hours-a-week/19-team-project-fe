import { BusinessError, HttpError, buildApiUrl } from '@/shared/api';
import type { ApiResponse } from '@/shared/api/types';

export type KakaoLoginBackendResponse = {
  status: 'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED' | 'ACCOUNT_CHOICE_REQUIRED';
  login_success: {
    user_id: number;
    user_type: string;
    access_token: string;
    refresh_token: string;
  } | null;
  signup_required: {
    oauth_provider: 'KAKAO';
    oauth_id: string;
    email: string | null;
    nickname: string | null;
  } | null;
  restore_required: {
    oauth_provider: 'KAKAO';
    oauth_id: string;
    email: string | null;
    nickname: string | null;
    email_conflict?: boolean;
    nickname_conflict?: boolean;
  } | null;
};

type SignupRequestPayload = {
  oauth_provider: 'KAKAO';
  oauth_id: string;
  email: string;
  company_email?: string;
  nickname: string;
  user_type: 'JOB_SEEKER' | 'EXPERT';
  career_level_id: number;
  job_ids: number[];
  skills: Array<{
    skill_id: number;
    display_order: number;
  }>;
  introduction: string;
};

type SignupResponsePayload = {
  user_id: number;
  access_token: string;
  refresh_token: string;
};

type RestoreRequestPayload = {
  oauth_provider: 'KAKAO';
  oauth_id: string;
  email: string;
  nickname: string;
};

type RestoreResponsePayload = {
  user_id: number;
  user_type: string;
  access_token: string;
  refresh_token: string;
};

export async function loginWithKakao(code: string): Promise<KakaoLoginBackendResponse> {
  const res = await fetch(buildApiUrl('/api/v1/auth/oauth/kakao/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error('KAKAO_LOGIN_FAILED');
  }

  const body = await res.json();
  return body.data as KakaoLoginBackendResponse;
}

/* ✅ 여기 추가 */
export async function signup(payload: SignupRequestPayload): Promise<SignupResponsePayload> {
  const res = await fetch(buildApiUrl('/api/v1/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let body: ApiResponse<SignupResponsePayload> | null = null;
  try {
    body = (await res.json()) as ApiResponse<SignupResponsePayload>;
  } catch {
    body = null;
  }

  if (body && typeof body.code === 'string') {
    if (body.code === 'OK' || body.code === 'SUCCESS' || body.code === 'CREATED') {
      return body.data as SignupResponsePayload;
    }
    throw new BusinessError(body.code, body.message, body.data);
  }

  if (!res.ok) {
    throw new HttpError(res.status, res.statusText, res.url);
  }

  throw new Error('Invalid signup response');
}

export async function restoreAccount(
  payload: RestoreRequestPayload,
): Promise<RestoreResponsePayload> {
  const res = await fetch(buildApiUrl('/api/v1/auth/restore'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let body: ApiResponse<RestoreResponsePayload> | null = null;
  try {
    body = (await res.json()) as ApiResponse<RestoreResponsePayload>;
  } catch {
    body = null;
  }

  if (body && typeof body.code === 'string') {
    if (body.code === 'OK' || body.code === 'SUCCESS' || body.code === 'CREATED') {
      return body.data as RestoreResponsePayload;
    }
    throw new BusinessError(body.code, body.message, body.data);
  }

  if (!res.ok) {
    throw new HttpError(res.status, res.statusText, res.url);
  }

  throw new Error('Invalid restore response');
}
