type AuthStatus = {
  authenticated: true;
};

type GuestStatus = {
  authenticated: false;
};

export async function getMe(): Promise<AuthStatus | GuestStatus> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) {
    throw new Error('AUTH_CHECK_FAILED');
  }

  return res.json();
}
