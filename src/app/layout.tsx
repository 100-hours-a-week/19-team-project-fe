import type { Metadata } from 'next';
import Script from 'next/script';
import { pretendard } from '../shared/config/font';
import { ToastProvider } from '@/shared/ui/toast';
import { MetricsInitializer } from '@/shared/metrics/MetricsInitializer';
import { GaPageView } from '@/shared/metrics/GaPageView';
import './globals.css';

export const metadata: Metadata = {
  title: 'RE:FIT',
  description: 'RE:FIT',
  applicationName: 'RE:FIT',
  manifest: '/manifest.webmanifest',
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
    <html lang="en">
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
        <MetricsInitializer />
        <GaPageView />
        <ToastProvider>
          <div className="app-frame">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
