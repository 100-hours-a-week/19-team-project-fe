'use client';

import { useEffect, useRef } from 'react';

const ENABLE_RENDER_METRIC = process.env.NODE_ENV !== 'production';

export function useRenderMetric(name: string) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    if (!ENABLE_RENDER_METRIC) return;
    // 임시 계측: 리렌더 횟수 비교용 콘솔 로그
    console.info(`[render-metric] ${name} render #${renderCount.current}`);
  });
}
