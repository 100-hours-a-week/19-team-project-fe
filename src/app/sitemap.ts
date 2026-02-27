import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dev.re-fit.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/experts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}
