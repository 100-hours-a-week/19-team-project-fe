type KakaoLoginResponse = {
  user_id: number;
  user_type: string;
  access_token: string;
  refresh_token: string;
};

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
