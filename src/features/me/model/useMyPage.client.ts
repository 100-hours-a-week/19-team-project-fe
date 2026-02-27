import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useLogout } from '@/features/auth';
import { authStatusQueryKey, useAuthStatus } from '@/entities/auth';
import { userMeQueryKey, useUserMeQuery, type UserMe } from '@/entities/user';
import { deleteMe, getExpertStatus, type ExpertStatus } from '@/features/me';
import { useCommonApiErrorHandler } from '@/shared/api';
import { stompManager } from '@/shared/ws';

export function useMyPage() {
  const queryClient = useQueryClient();
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
      queryClient.setQueryData(authStatusQueryKey, { authenticated: false });
      queryClient.removeQueries({ queryKey: userMeQueryKey });
      await stompManager.disconnect().catch(() => null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('kakaoLoginResult');
        sessionStorage.removeItem('kakaoRestoreRequired');
      }
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
