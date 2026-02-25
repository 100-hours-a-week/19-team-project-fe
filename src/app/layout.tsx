import type { Metadata } from 'next';
import Script from 'next/script';
import { pretendard } from '../shared/config/font';
import { FcmBootstrap } from '@/features/notification-fcm';
import { QueryProvider } from '@/shared/lib/react-query';
import { ToastProvider } from '@/shared/ui/toast';
import { MetricsInitializer } from '@/shared/metrics/MetricsInitializer';
import { GaPageView } from '@/shared/metrics/GaPageView';
import { ServiceWorkerRegistrar } from '@/shared/lib/pwa';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dev.re-fit.kr';
const DEFAULT_OG_IMAGE = '/icons/refit-og-home.png';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RE:FIT',
    template: '%s | RE:FIT',
  },
  description: '현직자와 연결되어 커리어 피드백을 받고, 이력서와 지원 전략을 개선하는 RE:FIT',
  applicationName: 'RE:FIT',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'RE:FIT',
    title: 'RE:FIT',
    description: '현직자와 연결되어 커리어 피드백을 받고, 이력서와 지원 전략을 개선하는 RE:FIT',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'RE:FIT 서비스 대표 이미지',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RE:FIT',
    description: '현직자와 연결되어 커리어 피드백을 받고, 이력서와 지원 전략을 개선하는 RE:FIT',
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: 'RE:FIT',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icons/char_icon.png',
    apple: '/icons/char_icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-8YM02T7012"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
// Track recent page_view to prevent accidental double sends.
window.__gaLastPageView = null;
const _dlPush = dataLayer.push.bind(dataLayer);
dataLayer.push = function() {
  try {
    const payload = arguments && arguments[0];
    const isPageView = payload && payload[0] === 'event' && payload[1] === 'page_view';
    if (isPageView) {
      const params = payload[2] || {};
      const path = params.page_path || params.page_location || (location.pathname + location.search);
      window.__gaLastPageView = { path, ts: Date.now() };
    }
  } catch (_) {
    // no-op
  }
  return _dlPush.apply(this, arguments);
};
gtag('js', new Date());
gtag('config', 'G-8YM02T7012', { send_page_view: false });`}
        </Script>
      </head>
      <body className={`${pretendard.variable} app-shell antialiased`}>
        <ServiceWorkerRegistrar />
        <MetricsInitializer />
        <GaPageView />
        <QueryProvider>
          <ToastProvider>
            <FcmBootstrap />
            <div className="app-frame">{children}</div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
