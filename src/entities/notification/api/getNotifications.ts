import { apiFetch, readAccessToken } from '@/shared/api';

import type { NotificationListData } from '../model/types';

const NOTIFICATIONS_PATH = '/bff/notifications';

export async function getNotifications(
  cursor?: number,
  size: number = 20,
): Promise<NotificationListData> {
  const accessToken = readAccessToken();
  const query = new URLSearchParams();
  if (cursor !== undefined && cursor !== null) query.set('cursor', String(cursor));
  if (size > 0) query.set('size', String(size));
  const path = `${NOTIFICATIONS_PATH}${query.size > 0 ? `?${query.toString()}` : ''}`;

  return apiFetch<NotificationListData>(path, {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}
