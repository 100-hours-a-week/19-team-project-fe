'use client';

import { useEffect, useState } from 'react';

type LottieComponent = typeof import('lottie-react').default;
type LottieData = Record<string, unknown>;

const reportCreateSuccessKey = 'reportCreateSuccess';
const reportCreateSuccessPath = '/Success.json';

export default function ReportCreateSuccessAnimation() {
  const [animationData, setAnimationData] = useState<LottieData | null>(null);
  const [Lottie, setLottie] = useState<LottieComponent | null>(null);

  useEffect(() => {
    const flag = sessionStorage.getItem(reportCreateSuccessKey);
    if (!flag) return;

    let cancelled = false;

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
        if (data) {
          setAnimationData(data);
        } else {
          sessionStorage.removeItem(reportCreateSuccessKey);
        }
      })
      .catch(() => {
        if (cancelled) return;
        sessionStorage.removeItem(reportCreateSuccessKey);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!animationData || !Lottie) return null;

  const handleComplete = () => {
    sessionStorage.removeItem(reportCreateSuccessKey);
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
