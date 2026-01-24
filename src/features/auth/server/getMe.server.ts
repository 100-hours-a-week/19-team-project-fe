import { cookies } from 'next/headers';

export async function getMe() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return { authenticated: false as const };
  }

  return {
    authenticated: true as const,
  };
}
