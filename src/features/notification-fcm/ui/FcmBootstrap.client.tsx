'use client';

import { useEffect, useRef } from 'react';

import { useAuthStatus } from '@/entities/auth';
import { useFcmLifecycle } from '../model/useFcmLifecycle.client';
import { useEventsSse } from '../model/useEventsSse.client';

export default function FcmBootstrap() {
  const { status } = useAuthStatus();
  const { initFcm, listenForeground } = useFcmLifecycle();
  useEventsSse();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authed') {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;

    initializedRef.current = true;
    void initFcm({ requestPermission: false });
    const cleanup = listenForeground();

    return () => {
      cleanup();
      initializedRef.current = false;
    };
  }, [initFcm, listenForeground, status]);

  return null;
}
