import * as Sentry from '@sentry/nextjs';

const edgeTracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05);

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: Number.isFinite(edgeTracesSampleRate) ? edgeTracesSampleRate : 0.05,
  enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
});
