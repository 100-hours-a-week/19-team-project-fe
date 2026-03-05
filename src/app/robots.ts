import type { MetadataRoute } from 'next';
import { CANONICAL_SITE_URL, IS_NOINDEX_ENV, SITE_URL } from '@/shared/config/site';

export default function robots(): MetadataRoute.Robots {
  if (IS_NOINDEX_ENV) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  const indexableSiteUrl = CANONICAL_SITE_URL || SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/onboarding',
          '/me',
          '/chat',
          '/resume',
          '/report',
          '/notifications',
          '/oauth',
          '/bff',
          '/metrics',
        ],
      },
    ],
    host: indexableSiteUrl,
    sitemap: `${indexableSiteUrl}/sitemap.xml`,
  };
}
