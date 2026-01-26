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
    cookieStore.set('user_id', String(userId), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
