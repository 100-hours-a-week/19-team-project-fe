'use client';

import { useMemo } from 'react';

import { useAuthStatus } from '@/entities/auth';
import { useUserMeQuery } from '@/entities/user';

export function useChatCurrentUser() {
  const { status: authStatus } = useAuthStatus();
  const { data, isLoading } = useUserMeQuery({ enabled: authStatus === 'authed' });
  const currentUserId = useMemo(
    () => (Number.isFinite(data?.id) ? (data?.id ?? null) : null),
    [data?.id],
  );

  return { currentUserId, isLoading };
}
