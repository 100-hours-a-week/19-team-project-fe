import { apiFetch, readAccessToken } from '@/shared/api';

const NOTIFICATIONS_PATH = '/bff/notifications';

type ReadAllNotificationsResponse = {
  updated_count: number;
};

export async function readAllNotifications(): Promise<ReadAllNotificationsResponse> {
  const accessToken = readAccessToken();
  return apiFetch<ReadAllNotificationsResponse>(NOTIFICATIONS_PATH, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ is_read: true }),
  });
}
