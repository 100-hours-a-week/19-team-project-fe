import { apiFetch, readAccessToken } from '@/shared/api';

const NOTIFICATIONS_PATH = '/bff/notifications';

type ReadNotificationResponse = {
  notification_id: number;
  is_read: boolean;
  read_at: string | null;
};

export async function readNotification(notificationId: number): Promise<ReadNotificationResponse> {
  const accessToken = readAccessToken();
  return apiFetch<ReadNotificationResponse>(`${NOTIFICATIONS_PATH}/${notificationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ is_read: true }),
  });
}
