import type { MetadataRoute } from 'next';
import { IS_NOINDEX_ENV, SITE_URL } from '@/shared/config/site';

export default function robots(): MetadataRoute.Robots {
  if (IS_NOINDEX_ENV) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

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
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
