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

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  if (userId !== null && userId !== undefined) {
    // Intentionally avoid setting user_id on the client for security.
  }
}
