type KakaoLoginResponse = {
  user_id: number;
  user_type: string;
  access_token: string;
  refresh_token: string;
};

type SignupRequestPayload = {
  oauth_provider: 'KAKAO';
  oauth_id: string;
  email: string;
  nickname: string;
  user_type: 'JOB_SEEKER';
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

const SIGNUP_PATH = '/api/v1/auth/signup';

export async function loginWithKakao(code: string): Promise<KakaoLoginResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/oauth/kakao/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error('KAKAO_LOGIN_FAILED');
  }

  const body = await res.json();

  return body.data as KakaoLoginResponse;
}

export async function signup(payload: SignupRequestPayload): Promise<SignupResponsePayload> {
  const url = buildApiUrl(SIGNUP_PATH);
  return apiFetch<SignupResponsePayload>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
import { apiFetch, buildApiUrl } from '@/shared/api';
