import { useEffect, useMemo, useState } from 'react';

import { useLogout } from '@/features/auth';
import { deleteMe, getExpertStatus, type ExpertStatus } from '@/features/me';
import { useAuthStatus } from '@/entities/auth';
import { useUserMeQuery, type UserMe } from '@/entities/user';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useMyPage() {
  const { status: authStatus, refresh: refreshAuthStatus } = useAuthStatus();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expertStatus, setExpertStatus] = useState<ExpertStatus | null>(null);
  const [isLoadingExpertStatus, setIsLoadingExpertStatus] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { isLoggingOut, logout } = useLogout();

  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
  } = useUserMeQuery({ enabled: authStatus === 'authed' });

  const user = useMemo<UserMe | null>(
    () => (authStatus === 'authed' ? (userData ?? null) : null),
    [authStatus, userData],
  );

  useEffect(() => {
    if (!userError) {
      setLoadError(null);
      return;
    }
    (async () => {
      const handled = await handleCommonApiError(userError);
      if (!handled) {
        setLoadError(
          userError instanceof Error ? userError.message : '내 정보를 불러오지 못했습니다.',
        );
      }
    })();
  }, [handleCommonApiError, userError]);

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
    const success = await logout();
    await refreshAuthStatus();
    return success;
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
