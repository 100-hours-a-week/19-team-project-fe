export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
export const API_PATH_SUFFIX = process.env.NEXT_PUBLIC_API_PATH_SUFFIX ?? '';

const applyPathSuffix = (path: string) => {
  if (!API_PATH_SUFFIX) return path;
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
