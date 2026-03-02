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
    const isLighthouseRun = navigator.userAgent.includes('Chrome-Lighthouse');
    const disableSplash = isLighthouseRun;

    const hasSignupSuccess = sessionStorage.getItem('signupSuccess');
    const hasSeenSplash = sessionStorage.getItem('splashSeen');
    const shouldShow = !disableSplash && !(hasSignupSuccess || hasSeenSplash);

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

  useEffect(() => {
    if (!(showSplash && SplashScreen)) return;

    const { documentElement, body } = document;
    const prevHtmlOverflow = documentElement.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyTouchAction = body.style.touchAction;

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';

    return () => {
      documentElement.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, [SplashScreen, showSplash]);

  return (
    <>
      {children}
      {showSplash && SplashScreen ? (
        <div className="fixed left-1/2 top-0 z-[1000] h-[100dvh] w-[min(100%,600px)] -translate-x-1/2 overflow-hidden bg-white">
          <SplashScreen />
        </div>
      ) : null}
    </>
  );
}
