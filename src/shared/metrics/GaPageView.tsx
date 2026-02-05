'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = 'G-8YM02T7012';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    __gaLastPageView?: { path: string; ts: number } | null;
  }
}

export function GaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    const last = window.__gaLastPageView;
    const recentlySentSamePath = last && last.path === pagePath && Date.now() - last.ts < 1000;

    if (typeof window.gtag === 'function' && !recentlySentSamePath) {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
