'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const chatRequestSuccessKey = 'chatRequestSuccess';
const chatRequestSuccessPath = '/Telegram.json';

type LottieData = Record<string, unknown>;

export default function ChatRequestSuccessAnimation() {
  const [animationData, setAnimationData] = useState<LottieData | null>(null);

  useEffect(() => {
    const flag = sessionStorage.getItem(chatRequestSuccessKey);
    if (!flag) return;

    let cancelled = false;

    fetch(chatRequestSuccessPath)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as LottieData;
      })
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setAnimationData(data);
        } else {
          sessionStorage.removeItem(chatRequestSuccessKey);
        }
      })
      .catch(() => {
        if (cancelled) return;
        sessionStorage.removeItem(chatRequestSuccessKey);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!animationData) return null;

  const handleComplete = () => {
    sessionStorage.removeItem(chatRequestSuccessKey);
    setAnimationData(null);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <Lottie
        animationData={animationData}
        loop={false}
        onComplete={handleComplete}
        className="h-[60vh] w-[60vw] max-h-[520px] max-w-[520px]"
        aria-hidden
      />
    </div>
  );
}
