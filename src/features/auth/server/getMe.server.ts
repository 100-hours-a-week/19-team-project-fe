import { cookies } from 'next/headers';

type AuthStatus = {
  authenticated: true;
};

type GuestStatus = {
  authenticated: false;
};

export async function getMe(): Promise<AuthStatus | GuestStatus> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return { authenticated: false };
  }

  return { authenticated: true };
}
