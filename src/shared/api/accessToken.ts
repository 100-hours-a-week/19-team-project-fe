export function readAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith('access_token='))
    ?.split('=')[1];
  return value ? decodeURIComponent(value) : null;
}
