'use client';

import { ReactNode, useEffect, useState } from 'react';

import SplashScreen from './SplashScreen';

interface SplashGateProps {
  children: ReactNode;
  durationMs?: number;
}

export default function SplashGate({ children, durationMs = 5000 }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('signupSuccess') ? false : true;
  });

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, showSplash]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
