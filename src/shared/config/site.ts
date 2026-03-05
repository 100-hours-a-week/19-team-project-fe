const PROD_SITE_URL = 'https://re-fit.kr';
const LOCAL_SITE_URL = 'http://localhost:3000';

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return normalizeUrl(envUrl);
  return process.env.NODE_ENV === 'production' ? PROD_SITE_URL : LOCAL_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();
export const CANONICAL_SITE_URL = normalizeUrl(process.env.NEXT_PUBLIC_CANONICAL_URL ?? PROD_SITE_URL);

const siteHost = new URL(SITE_URL).hostname;
export const IS_NOINDEX_ENV = siteHost === 'localhost' || siteHost.startsWith('dev.');

