'use client';

export const APP_NOTIFICATION_EVENT = 'app:notification';

export type AppNotificationType =
  | 'CHAT_MESSAGE_RECEIVED'
  | 'CHAT_REQUEST_CREATED'
  | 'RESUME_PARSE_COMPLETED'
  | 'RESUME_PARSE_FAILED'
  | 'REPORT_GENERATE_COMPLETED'
  | 'REPORT_GENERATE_FAILED';

export type AppNotificationEventDetail = {
  notificationType: AppNotificationType;
};
