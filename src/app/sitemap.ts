import type { MetadataRoute } from 'next';
import { CANONICAL_SITE_URL, IS_NOINDEX_ENV, SITE_URL } from '@/shared/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const indexableSiteUrl = IS_NOINDEX_ENV ? SITE_URL : CANONICAL_SITE_URL;

  return [
    {
      url: `${indexableSiteUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${indexableSiteUrl}/experts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}
