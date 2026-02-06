'use client';

import { useCallback, useEffect, useState } from 'react';

type AuthStatus = 'checking' | 'authed' | 'guest';

type AuthCheckResult = {
  authenticated: boolean;
};

type AuthCheck = () => Promise<AuthCheckResult>;

export function useAuthGate(checkAuth: AuthCheck) {
  const [status, setStatus] = useState<AuthStatus>('checking');

  const runCheck = useCallback(async () => {
    setStatus('checking');
    try {
      const auth = await checkAuth();
      setStatus(auth.authenticated ? 'authed' : 'guest');
    } catch {
      setStatus('guest');
    }
  }, [checkAuth]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const auth = await checkAuth();
        if (cancelled) return;
        setStatus(auth.authenticated ? 'authed' : 'guest');
      } catch {
        if (cancelled) return;
        setStatus('guest');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  return { status, refresh: runCheck };
}
