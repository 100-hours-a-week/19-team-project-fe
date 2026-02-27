import { cookies } from 'next/headers';

const cookieDomain = process.env.NODE_ENV === 'production' ? '.re-fit.kr' : undefined;

export async function setAuthCookies({
  accessToken,
  refreshToken,
  userId,
}: {
  accessToken: string;
  refreshToken: string;
  userId?: number;
}) {
  const cookieStore = await cookies();

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain,
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain,
  });

  if (userId !== null && userId !== undefined) {
    // Intentionally avoid setting user_id on the client for security.
  }
}
