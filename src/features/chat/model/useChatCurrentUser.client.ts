'use client';

import { useEffect, useRef, useState } from 'react';

import { refreshAuthTokens, useCommonApiErrorHandler } from '@/shared/api';
import { getUserMe } from '@/features/me';

export function useChatCurrentUser() {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const didRetryUserRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const me = await getUserMe();
        if (cancelled) return;
        if (!me) {
          if (!didRetryUserRef.current) {
            didRetryUserRef.current = true;
            const refreshed = await refreshAuthTokens().catch(() => false);
            if (!refreshed || cancelled) {
              setCurrentUserId(null);
              return;
            }
            const retryMe = await getUserMe().catch(() => null);
            if (cancelled) return;
            if (!retryMe) {
              setCurrentUserId(null);
              return;
            }
            setCurrentUserId(Number.isFinite(retryMe.id) ? retryMe.id : null);
            return;
          }
          setCurrentUserId(null);
          return;
        }
        setCurrentUserId(Number.isFinite(me.id) ? me.id : null);
      } catch (error) {
        if (cancelled) return;
        const handled = await handleCommonApiError(error);
        if (!handled) {
          console.warn('Failed to load current user:', error);
        }
        setCurrentUserId(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handleCommonApiError]);

  return { currentUserId, isLoading };
}
