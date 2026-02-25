import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dev.re-fit.kr';

export default function robots(): MetadataRoute.Robots {
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
