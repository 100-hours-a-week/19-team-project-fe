'use client';

import { useEffect } from 'react';
import { initWebVitals } from './web-vitals';

export function MetricsInitializer() {
  useEffect(() => {
    // 프로덕션 또는 명시적 활성화 시에만 실행
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_METRICS_ENABLED === 'true'
    ) {
      initWebVitals();
    }
  }, []);

  return null;
}
