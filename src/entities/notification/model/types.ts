export type NotificationItem = {
  notification_id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type NotificationListData = {
  notifications: NotificationItem[];
  next_cursor: string | null;
  has_more: boolean;
  unread_count: number;
};
