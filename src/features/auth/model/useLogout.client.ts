'use client';

import { useState } from 'react';

import { logout } from '@/features/auth';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useLogout() {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const runLogout = async () => {
    if (isLoggingOut) return false;
    setIsLoggingOut(true);
    try {
      await logout();
      return true;
    } catch (error) {
      if (await handleCommonApiError(error)) {
        return false;
      }
      return false;
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { isLoggingOut, logout: runLogout };
}
