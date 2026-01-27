import { onLCP, onFCP, onCLS, onINP, onTTFB, type Metric } from 'web-vitals';

const sendToAnalytics = async (metric: Metric) => {
  const payload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: (metric as any).navigationType || 'unknown',
    pathname: window.location.pathname,
  };

  // Beacon API로 전송
  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json',
  });
  navigator.sendBeacon('/api/metrics/web-vitals', blob);
};

export const initWebVitals = () => {
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onTTFB(sendToAnalytics);
};
