import { cookies } from 'next/headers';

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
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.NODE_ENV === 'production' ? '.re-fit.kr' : undefined;

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    domain,
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    domain,
  });

  if (userId !== null && userId !== undefined) {
    // Intentionally avoid setting user_id on the client for security.
  }
}
