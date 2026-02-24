type ApiMetricInput = {
  url: string | null;
  method: string;
  status: number;
  durationMs: number;
};

type EndpointMetric = {
  calls: number;
  totalDurationMs: number;
  durationsMs: number[];
  calledAt: number[];
  duplicateCalls: number;
  rehitWithinWindowCalls: number;
  errorCalls: number;
};

const DUP_WINDOW_MS = 30_000;
const REPORT_INTERVAL_MS = 10_000;
const MAX_SAMPLES_PER_ENDPOINT = 200;
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

const metricsByEndpoint = new Map<string, EndpointMetric>();
let reportTimeoutId: ReturnType<typeof setTimeout> | null = null;
let debugApiRegistered = false;

declare global {
  interface Window {
    __apiMetricsPrint?: () => void;
    __apiMetricsReset?: () => void;
  }
}

function isEnabled() {
  return (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_API_METRICS === '1'
  );
}

function pushLimited(list: number[], value: number) {
  list.push(value);
  if (list.length > MAX_SAMPLES_PER_ENDPOINT) {
    list.shift();
  }
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

function normalizeUrl(rawUrl: string | null) {
  if (!rawUrl) return 'unknown';

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const normalizedPath = parsed.pathname
      .replace(/\/\d+(?=\/|$)/g, '/:id')
      .replace(UUID_REGEX, ':uuid');

    // Keep only pagination-like params to avoid key explosion.
    const keepParams = ['cursor', 'page', 'size', 'limit'];
    const keptQuery = keepParams
      .map((key) => {
        const value = parsed.searchParams.get(key);
        return value ? `${key}=${value}` : null;
      })
      .filter(Boolean)
      .join('&');

    return keptQuery ? `${normalizedPath}?${keptQuery}` : normalizedPath;
  } catch {
    return rawUrl.replace(/\/\d+(?=\/|$)/g, '/:id').replace(UUID_REGEX, ':uuid');
  }
}

function getRecord(endpointKey: string): EndpointMetric {
  const existing = metricsByEndpoint.get(endpointKey);
  if (existing) return existing;

  const created: EndpointMetric = {
    calls: 0,
    totalDurationMs: 0,
    durationsMs: [],
    calledAt: [],
    duplicateCalls: 0,
    rehitWithinWindowCalls: 0,
    errorCalls: 0,
  };

  metricsByEndpoint.set(endpointKey, created);
  return created;
}

function scheduleReport() {
  if (reportTimeoutId) return;
  reportTimeoutId = setTimeout(() => {
    reportTimeoutId = null;
    printApiMetrics();
  }, REPORT_INTERVAL_MS);
}

function ensureDebugApi() {
  if (!isEnabled() || debugApiRegistered) return;
  window.__apiMetricsPrint = printApiMetrics;
  window.__apiMetricsReset = resetApiMetrics;
  debugApiRegistered = true;
  console.info('[API Metrics] enabled. Use window.__apiMetricsPrint() to print now.');
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function trackApiRequest({ url, method, status, durationMs }: ApiMetricInput) {
  if (!isEnabled()) return;
  ensureDebugApi();

  const endpoint = normalizeUrl(url);
  const endpointKey = `${method.toUpperCase()} ${endpoint}`;
  const now = Date.now();
  const record = getRecord(endpointKey);

  const prevCalledAt = record.calledAt[record.calledAt.length - 1];
  if (record.calls > 0) {
    record.duplicateCalls += 1;
  }
  if (typeof prevCalledAt === 'number' && now - prevCalledAt < DUP_WINDOW_MS) {
    record.rehitWithinWindowCalls += 1;
  }

  record.calls += 1;
  record.totalDurationMs += durationMs;
  if (status >= 400 || status === 0) {
    record.errorCalls += 1;
  }
  pushLimited(record.durationsMs, durationMs);
  pushLimited(record.calledAt, now);

  scheduleReport();
}

export function printApiMetrics() {
  if (!isEnabled()) return;

  const rows = Array.from(metricsByEndpoint.entries())
    .map(([endpoint, data]) => {
      const avg = data.calls > 0 ? data.totalDurationMs / data.calls : 0;
      const p95 = percentile(data.durationsMs, 95);
      const duplicateRate = data.calls > 0 ? data.duplicateCalls / data.calls : 0;
      const rehitBase = Math.max(1, data.calls - 1);
      const rehitWithin30sRate = data.rehitWithinWindowCalls / rehitBase;
      const errorRate = data.calls > 0 ? data.errorCalls / data.calls : 0;

      return {
        endpoint,
        calls: data.calls,
        duplicateRate: formatRate(duplicateRate),
        rehitWithin30sRate: formatRate(rehitWithin30sRate),
        avgMs: Number(avg.toFixed(1)),
        p95Ms: Number(p95.toFixed(1)),
        errorRate: formatRate(errorRate),
      };
    })
    .sort((a, b) => b.calls - a.calls);

  if (rows.length === 0) return;

  console.groupCollapsed(`[API Metrics] ${new Date().toLocaleTimeString()} (${rows.length})`);
  console.table(rows);
  console.groupEnd();
}

export function resetApiMetrics() {
  metricsByEndpoint.clear();
}
