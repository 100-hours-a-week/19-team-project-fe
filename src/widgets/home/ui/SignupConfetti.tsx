'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const signupConfettiFlagKey = 'signupSuccess';
const signupConfettiPath = '/lottie/signup-confetti.json';

type LottieData = Record<string, unknown>;

export default function SignupConfetti() {
  const [animationData, setAnimationData] = useState<LottieData | null>(null);

  useEffect(() => {
    const flag = sessionStorage.getItem(signupConfettiFlagKey);
    if (!flag) return;

    let cancelled = false;

    fetch(signupConfettiPath)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as LottieData;
      })
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setAnimationData(data);
        } else {
          sessionStorage.removeItem(signupConfettiFlagKey);
        }
      })
      .catch(() => {
        if (cancelled) return;
        sessionStorage.removeItem(signupConfettiFlagKey);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!animationData) return null;

  const handleComplete = () => {
    sessionStorage.removeItem(signupConfettiFlagKey);
    setAnimationData(null);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <Lottie
        animationData={animationData}
        loop={false}
        onComplete={handleComplete}
        className="h-full w-full"
        aria-hidden
      />
    </div>
  );
}
