import { useEffect, useState } from 'react';

import { getMe, logout } from '@/features/auth';
import {
  deleteMe,
  getExpertStatus,
  getUserMe,
  type ExpertStatus,
  type UserMe,
} from '@/features/me';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useMyPage() {
  const { status: authStatus, refresh: refreshAuthStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler();
  const [user, setUser] = useState<UserMe | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expertStatus, setExpertStatus] = useState<ExpertStatus | null>(null);
  const [isLoadingExpertStatus, setIsLoadingExpertStatus] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setUser(null);
      setIsLoadingUser(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingUser(true);

    (async () => {
      try {
        const data = await getUserMe();
        if (cancelled) return;
        if (!data) {
          setUser(null);
          setLoadError(null);
          return;
        }
        setUser(data);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingUser(false);
          return;
        }
        setLoadError(error instanceof Error ? error.message : '내 정보를 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoadingUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError]);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setExpertStatus(null);
      setIsLoadingExpertStatus(false);
      return;
    }
    if (!user) {
      setExpertStatus(null);
      setIsLoadingExpertStatus(false);
      return;
    }

    let cancelled = false;
    setIsLoadingExpertStatus(true);

    (async () => {
      try {
        const data = await getExpertStatus();
        if (cancelled) return;
        setExpertStatus(data);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingExpertStatus(false);
          return;
        }
        setExpertStatus(null);
      } finally {
        if (cancelled) return;
        setIsLoadingExpertStatus(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError, user]);

  const handleLogout = async () => {
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
      await refreshAuthStatus();
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return false;
    setIsDeletingAccount(true);
    try {
      await deleteMe();
      return true;
    } catch (error) {
      if (await handleCommonApiError(error)) {
        return false;
      }
      return false;
    } finally {
      await refreshAuthStatus();
      setIsDeletingAccount(false);
    }
  };

  return {
    authStatus,
    user,
    isLoadingUser,
    loadError,
    expertStatus,
    isLoadingExpertStatus,
    isLoggingOut,
    isDeletingAccount,
    handleLogout,
    handleDeleteAccount,
  };
}
