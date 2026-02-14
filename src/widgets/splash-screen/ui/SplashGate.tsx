'use client';

import { ReactNode, useEffect, useState } from 'react';

type SplashScreenComponent = React.ComponentType;

interface SplashGateProps {
  children: ReactNode;
  durationMs?: number;
}

export default function SplashGate({ children, durationMs = 5000 }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [SplashScreen, setSplashScreen] = useState<SplashScreenComponent | null>(null);

  useEffect(() => {
    const hasSignupSuccess = sessionStorage.getItem('signupSuccess');
    const hasSeenSplash = sessionStorage.getItem('splashSeen');
    const shouldShow = !(hasSignupSuccess || hasSeenSplash);

    sessionStorage.setItem('splashSeen', 'true');
    setShowSplash(shouldShow);

    if (!shouldShow) return;
    let cancelled = false;
    import('./SplashScreen').then((mod) => {
      if (!cancelled) setSplashScreen(() => mod.default);
    });
    const timer = setTimeout(() => setShowSplash(false), durationMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [durationMs]);

  return (
    <>
      {children}
      {showSplash && SplashScreen ? (
        <div className="absolute inset-0 z-50 bg-white">
          <SplashScreen />
        </div>
      ) : null}
    </>
  );
}
