'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    __gaLastPageView?: { path: string; ts: number } | null;
  }
}

export function GaPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const query = typeof window !== 'undefined' ? window.location.search : '';
    const pagePath = query ? `${pathname}${query}` : pathname;

    const last = window.__gaLastPageView;
    const recentlySentSamePath = last && last.path === pagePath && Date.now() - last.ts < 1000;

    if (typeof window.gtag === 'function' && !recentlySentSamePath) {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
      });
    }
  }, [pathname]);

  return null;
}
