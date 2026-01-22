'use client';

import { ReactNode, useEffect, useState } from 'react';

import SplashScreen from './SplashScreen';

interface SplashGateProps {
  children: ReactNode;
  durationMs?: number;
}

export default function SplashGate({ children, durationMs = 5000 }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('signupSuccess')) {
      setShowSplash(false);
      return;
    }
    const timer = setTimeout(() => setShowSplash(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
