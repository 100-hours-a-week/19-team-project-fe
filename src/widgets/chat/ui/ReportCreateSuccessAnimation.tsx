'use client';

import { useEffect, useState } from 'react';

import { consumeReportCreateSuccess, REPORT_CREATE_SUCCESS_EVENT } from '@/features/chat';

type LottieComponent = typeof import('lottie-react').default;
type LottieData = Record<string, unknown>;

const reportCreateSuccessPath = '/Success.json';

export default function ReportCreateSuccessAnimation() {
  const [animationData, setAnimationData] = useState<LottieData | null>(null);
  const [Lottie, setLottie] = useState<LottieComponent | null>(null);

  useEffect(() => {
    let cancelled = false;

    const startAnimation = () => {
      if (!consumeReportCreateSuccess()) return;

      import('lottie-react').then((mod) => {
        if (!cancelled) setLottie(() => mod.default);
      });

      fetch(reportCreateSuccessPath)
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as LottieData;
        })
        .then((data) => {
          if (cancelled) return;
          setAnimationData(data);
        })
        .catch(() => {
          if (cancelled) return;
          setAnimationData(null);
        });
    };

    startAnimation();
    window.addEventListener(REPORT_CREATE_SUCCESS_EVENT, startAnimation);

    return () => {
      cancelled = true;
      window.removeEventListener(REPORT_CREATE_SUCCESS_EVENT, startAnimation);
    };
  }, []);

  if (!animationData || !Lottie) return null;

  const handleComplete = () => {
    setAnimationData(null);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <Lottie
        animationData={animationData}
        loop={false}
        onComplete={handleComplete}
        className="h-[56vh] w-[56vw] max-h-[480px] max-w-[480px]"
        aria-hidden
      />
    </div>
  );
}
