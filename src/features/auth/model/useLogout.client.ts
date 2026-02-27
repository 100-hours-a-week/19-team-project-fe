'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { authStatusQueryKey } from '@/entities/auth';
import { userMeQueryKey } from '@/entities/user';
import { logout } from '@/features/auth';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useLogout() {
  const queryClient = useQueryClient();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const runLogout = async () => {
    if (isLoggingOut) return false;
    setIsLoggingOut(true);
    try {
      await logout();
      queryClient.setQueryData(authStatusQueryKey, { authenticated: false });
      queryClient.removeQueries({ queryKey: userMeQueryKey });
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
