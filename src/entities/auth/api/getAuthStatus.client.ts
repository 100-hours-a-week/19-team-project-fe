type AuthStatus = {
  authenticated: true;
};

type GuestStatus = {
  authenticated: false;
};

export async function getAuthStatus(): Promise<AuthStatus | GuestStatus> {
  const res = await fetch('/bff/auth/me', {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('AUTH_CHECK_FAILED');
  }

  return res.json();
}
