'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getNotifications } from '../api/getNotifications';
import { readAllNotifications } from '../api/readAllNotifications';
import { readNotification } from '../api/readNotification';

export const notificationsQueryKey = ['notifications'] as const;

function parseCursor(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export function useNotificationsQuery(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: notificationsQueryKey,
    queryFn: ({ pageParam }) => getNotifications(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? parseCursor(lastPage.next_cursor) : undefined,
    enabled,
    staleTime: 15_000,
  });
}

export function useReadNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => readNotification(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}

export function useReadAllNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: readAllNotifications,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}
