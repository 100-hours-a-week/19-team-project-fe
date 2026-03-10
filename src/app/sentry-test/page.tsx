import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SentryTestPanel } from '@/features/sentry-test';

export const metadata: Metadata = {
  title: 'Sentry Test',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SentryTestPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_SENTRY_TEST_PAGE !== 'true') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <SentryTestPanel />
    </main>
  );
}
