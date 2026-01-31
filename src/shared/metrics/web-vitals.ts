import { onLCP, onFCP, onCLS, onINP, onTTFB, type Metric } from 'web-vitals';

/**
 * 동적 경로를 패턴으로 정규화
 * 예: /chat/30 → /chat/:chatId
 */
const normalizePath = (pathname: string): string => {
  return (
    pathname
      // /chat/숫자 → /chat/:chatId
      .replace(/^\/chat\/\d+/g, '/chat/:chatId')
      // /experts/숫자 → /experts/:id
      .replace(/^\/experts\/\d+/g, '/experts/:id')
      // /resume/숫자 → /resume/:resumeId
      .replace(/^\/resume\/\d+/g, '/resume/:resumeId')
    // 정적 경로는 그대로 반환 (/, /login, /signup 등)
  );
};

const sendToAnalytics = async (metric: Metric) => {
  const payload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: (metric as any).navigationType || 'unknown',
    pathname: normalizePath(window.location.pathname),
  };

  // Beacon API로 전송
  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json',
  });
  navigator.sendBeacon('/metrics/web-vitals', blob);
};

export const initWebVitals = () => {
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onTTFB(sendToAnalytics);
};
