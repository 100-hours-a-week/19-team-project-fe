export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
export const API_PATH_SUFFIX = process.env.NEXT_PUBLIC_API_PATH_SUFFIX ?? '';
export const API_PATH_SUFFIX_TARGETS = (process.env.NEXT_PUBLIC_API_PATH_SUFFIX_TARGETS ?? '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const NO_SUFFIX_PATH_PREFIXES = [
  '/api/v1/auth/oauth/kakao/authorize',
  '/api/v1/auth/oauth/kakao/login',
  '/api/v1/auth/signup',
];

const shouldApplySuffix = (path: string) => {
  if (!API_PATH_SUFFIX) return false;
  const base = path.split('?')[0];
  if (NO_SUFFIX_PATH_PREFIXES.some((prefix) => base.startsWith(prefix))) return false;
  if (API_PATH_SUFFIX_TARGETS.length === 0) return true;
  return API_PATH_SUFFIX_TARGETS.some((target) => {
    const normalized = target.startsWith('/') ? target : `/${target}`;
    return base.startsWith(normalized);
  });
};

const applyPathSuffix = (path: string) => {
  if (!shouldApplySuffix(path)) return path;
  const [base, query] = path.split('?');
  const withSuffix = base.endsWith(API_PATH_SUFFIX) ? base : `${base}${API_PATH_SUFFIX}`;
  return query ? `${withSuffix}?${query}` : withSuffix;
};

export function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${applyPathSuffix(normalizedPath)}`;
}
