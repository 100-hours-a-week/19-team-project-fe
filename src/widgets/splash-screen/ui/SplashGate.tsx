'use client';

import { ReactNode, useEffect, useState } from 'react';

import SplashScreen from './SplashScreen';

interface SplashGateProps {
  children: ReactNode;
  durationMs?: number;
}

export default function SplashGate({ children, durationMs = 5000 }: SplashGateProps) {
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasSignupSuccess = sessionStorage.getItem('signupSuccess');
    const hasSeenSplash = sessionStorage.getItem('splashSeen');
    const shouldShow = !(hasSignupSuccess || hasSeenSplash);

    sessionStorage.setItem('splashSeen', 'true');
    setShowSplash(shouldShow);

    if (!shouldShow) return;
    const timer = setTimeout(() => setShowSplash(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  if (!mounted) return null;
  if (showSplash) return <SplashScreen />;

  return <>{children}</>;
}
