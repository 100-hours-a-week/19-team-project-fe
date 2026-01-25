type AuthCookiePayload = {
  accessToken: string;
  refreshToken?: string;
  userId?: number | string;
};

export function setAuthCookies({ accessToken, refreshToken, userId }: AuthCookiePayload) {
  if (typeof document === 'undefined') return;
  const base = 'path=/; SameSite=Lax';
  const secure = location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `access_token=${encodeURIComponent(accessToken)}; ${base}${secure}`;
  if (refreshToken) {
    document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; ${base}${secure}`;
  }
  if (userId !== undefined) {
    document.cookie = `user_id=${encodeURIComponent(String(userId))}; ${base}${secure}`;
  }
}
