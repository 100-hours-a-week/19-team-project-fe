'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStatus } from '@/entities/auth';
import {
  CHAT_LIST_REFRESH_EVENT,
  CHAT_REALTIME_REFRESH_EVENT,
  parseChatRealtimePayload,
  type ChatRealtimeRefreshPayload,
} from '@/entities/chat';
import { notificationsQueryKey } from '@/entities/notification';
import { reportsQueryKey } from '@/entities/reports';
import { resumesQueryKey } from '@/entities/resumes';
import { consumeSseStream } from '@/shared/lib/sse';
import {
  APP_NOTIFICATION_EVENT,
  type AppNotificationType,
  type AppNotificationEventDetail,
} from '@/shared/lib/realtimeNotification.client';

const EVENTS_SUBSCRIBE_PATH = '/bff/events/subscribe';
const SSE_RECONNECT_MIN_MS = 1000;
const SSE_RECONNECT_MAX_MS = 10000;

type NotificationEventLike = {
  type?: unknown;
  notification_type?: unknown;
  notification_id?: unknown;
  unread_count?: unknown;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isNotificationEvent(raw: unknown): raw is NotificationEventLike {
  if (!raw || typeof raw !== 'object') return false;
  const event = raw as NotificationEventLike;
  if (typeof event.type === 'string' && event.type.toUpperCase() === 'NOTIFICATION') return true;
  return (
    event.notification_type !== undefined ||
    event.notification_id !== undefined ||
    event.unread_count !== undefined
  );
}

function dispatchChatRefresh(detail: ChatRealtimeRefreshPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CHAT_REALTIME_REFRESH_EVENT, { detail }));
}

function dispatchChatListRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHAT_LIST_REFRESH_EVENT));
}

function parseNotificationType(raw: unknown): AppNotificationType | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = (raw as NotificationEventLike).notification_type;
  if (typeof value !== 'string') return null;
  const normalized = value.toUpperCase();
  if (
    normalized === 'CHAT_MESSAGE_RECEIVED' ||
    normalized === 'CHAT_REQUEST_CREATED' ||
    normalized === 'RESUME_PARSE_COMPLETED' ||
    normalized === 'RESUME_PARSE_FAILED' ||
    normalized === 'REPORT_GENERATE_COMPLETED' ||
    normalized === 'REPORT_GENERATE_FAILED'
  ) {
    return normalized;
  }
  return null;
}

function dispatchNotificationEvent(notificationType: AppNotificationType) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AppNotificationEventDetail>(APP_NOTIFICATION_EVENT, {
      detail: { notificationType },
    }),
  );
}

function handleRealtimeEvent(
  raw: unknown,
  invalidateNotifications: () => void,
  invalidateResumes: () => void,
  invalidateReports: () => void,
) {
  const chatPayload = parseChatRealtimePayload(raw);
  if (chatPayload) {
    dispatchChatRefresh(chatPayload);
    return;
  }

  if (isNotificationEvent(raw)) {
    invalidateNotifications();
    const notificationType = parseNotificationType(raw);
    if (notificationType) {
      dispatchNotificationEvent(notificationType);
    }
    if (
      notificationType === 'CHAT_MESSAGE_RECEIVED' ||
      notificationType === 'CHAT_REQUEST_CREATED'
    ) {
      dispatchChatListRefresh();
      return;
    }
    if (
      notificationType === 'RESUME_PARSE_COMPLETED' ||
      notificationType === 'RESUME_PARSE_FAILED'
    ) {
      invalidateResumes();
      return;
    }
    if (
      notificationType === 'REPORT_GENERATE_COMPLETED' ||
      notificationType === 'REPORT_GENERATE_FAILED'
    ) {
      invalidateReports();
    }
  }
}

export function useEventsSse() {
  const { status } = useAuthStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== 'authed') return;

    let cancelled = false;
    let controller: AbortController | null = null;

    const invalidateNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    };
    const invalidateResumes = () => {
      void queryClient.invalidateQueries({ queryKey: resumesQueryKey });
    };
    const invalidateReports = () => {
      void queryClient.invalidateQueries({ queryKey: reportsQueryKey });
    };

    const run = async () => {
      let reconnectDelayMs = SSE_RECONNECT_MIN_MS;

      while (!cancelled) {
        controller = new AbortController();

        try {
          const response = await fetch(EVENTS_SUBSCRIBE_PATH, {
            method: 'GET',
            headers: {
              Accept: 'text/event-stream',
            },
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(`SSE_CONNECT_FAILED_${response.status}`);
          }

          reconnectDelayMs = SSE_RECONNECT_MIN_MS;
          await consumeSseStream(response.body, {
            signal: controller.signal,
            onEvent: ({ data }) => {
              if (!data || data === '[DONE]') return;
              try {
                handleRealtimeEvent(
                  JSON.parse(data),
                  invalidateNotifications,
                  invalidateResumes,
                  invalidateReports,
                );
              } catch {
                // ignore malformed event payload
              }
            },
          });
        } catch {
          // silent reconnect
        } finally {
          controller = null;
        }

        if (cancelled) break;
        await sleep(reconnectDelayMs);
        reconnectDelayMs = Math.min(reconnectDelayMs * 2, SSE_RECONNECT_MAX_MS);
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [queryClient, status]);
}
