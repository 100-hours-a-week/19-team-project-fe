export async function kakaoLogin(code: string) {
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
