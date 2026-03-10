import * as Sentry from '@sentry/nextjs';

const clientTracesSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.05);

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: Number.isFinite(clientTracesSampleRate) ? clientTracesSampleRate : 0.05,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
