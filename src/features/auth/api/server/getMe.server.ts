import { cookies, headers } from 'next/headers';

type AuthStatus = {
  authenticated: true;
};

type GuestStatus = {
  authenticated: false;
};

export async function getMe(): Promise<AuthStatus | GuestStatus> {
  const cookieStore = await cookies();
  const accessTokenFromStore = cookieStore.get('access_token')?.value;
  if (accessTokenFromStore) {
    return { authenticated: true };
  }

  const headerStore = await headers();
  const cookieHeader = headerStore.get('cookie') ?? '';
  const accessTokenFromHeader = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith('access_token='))
    ?.split('=')[1];
  const accessToken = accessTokenFromHeader ? decodeURIComponent(accessTokenFromHeader) : null;

  if (!accessToken) {
    return { authenticated: false };
  }

  return { authenticated: true };
}
