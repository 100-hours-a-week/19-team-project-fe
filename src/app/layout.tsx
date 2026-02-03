import type { Metadata } from 'next';
import { pretendard } from '../shared/config/font';
import { ToastProvider } from '@/shared/ui/toast';
import { MetricsInitializer } from '@/shared/metrics/MetricsInitializer';
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
      <body className={`${pretendard.variable} app-shell antialiased`}>
        <MetricsInitializer />
        <ToastProvider>
          <div className="app-frame">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
