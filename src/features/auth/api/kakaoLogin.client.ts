type KakaoLoginResult =
  | {
      status: 'LOGIN_SUCCESS';
      userId: number;
      userType: string;
      accessToken: string;
    }
  | {
      status: 'SIGNUP_REQUIRED';
      signup_required: {
        oauth_provider: 'KAKAO';
        oauth_id: string;
        email: string | null;
        nickname: string | null;
      };
    };

export async function kakaoLogin(code: string): Promise<KakaoLoginResult> {
  const res = await fetch('/api/auth/kakao/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error('LOGIN_FAILED');
  }

  return res.json();
}
