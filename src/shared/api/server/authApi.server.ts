export type KakaoLoginBackendResponse = {
  status: 'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED';
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

export async function loginWithKakao(code: string): Promise<KakaoLoginBackendResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/oauth/kakao/login`, {
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
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('SIGNUP_FAILED');
  }

  const body = await res.json();
  return body.data as SignupResponsePayload;
}
