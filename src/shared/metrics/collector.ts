import type { MetricType, MetricData } from './types';

// 메트릭 버퍼링 (5초마다 또는 20개 쌓이면 전송)
// Beacon API로 비차단 전송
// 페이지 이탈 시 남은 메트릭 전송 (visibilitychange, pagehide)

let metricBuffer: Array<{ type: MetricType; data: MetricData }> = [];
let flushTimeout: NodeJS.Timeout | null = null;

const FLUSH_INTERVAL = 5000; // 5초
const MAX_BUFFER_SIZE = 20;

export const sendMetrics = (type: MetricType, data: MetricData) => {
  metricBuffer.push({
    type,
    data: {
      ...data,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: data.timestamp || Date.now(),
    },
  });

  // 버퍼가 가득 차면 즉시 전송
  if (metricBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics();
    return;
  }

  // 타이머 설정
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushMetrics, FLUSH_INTERVAL);
  }
};

const flushMetrics = () => {
  if (metricBuffer.length === 0) return;

  const metricsToSend = [...metricBuffer];
  metricBuffer = [];

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  // Beacon API로 전송
  const blob = new Blob([JSON.stringify(metricsToSend)], {
    type: 'application/json',
  });

  navigator.sendBeacon('/metrics/batch', blob);
};

// 페이지 이탈 시 남은 메트릭 전송
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics();
    }
  });

  window.addEventListener('pagehide', flushMetrics);
}
