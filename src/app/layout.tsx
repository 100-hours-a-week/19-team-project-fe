import type { Metadata } from 'next';
import { pretendard } from '../shared/config/font';
import { ToastProvider } from '@/shared/ui/toast';
import { MetricsInitializer } from '@/shared/metrics/MetricsInitializer';
import './globals.css';

export const metadata: Metadata = {
  title: 're-fit',
  description: 're-fit',
  applicationName: 're-fit',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 're-fit',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icons/char_main.png',
    apple: '/icons/char_main.png',
  },
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
