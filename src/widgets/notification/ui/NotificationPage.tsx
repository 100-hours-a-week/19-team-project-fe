'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStatus } from '@/entities/auth';
import {
  useNotificationsQuery,
  useReadAllNotificationsMutation,
  useReadNotificationMutation,
  type NotificationItem,
} from '@/entities/notification';
import {
  readStoredFcmToken,
  removeRegisteredFcmToken,
  useFcmLifecycle,
} from '@/features/notification-fcm';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import notificationChatRequest from '@/shared/icons/notification_chat_request.png';
import notificationMessage from '@/shared/icons/notification_message.png';
import notificationResumeAnalysis from '@/shared/icons/notification_resume_analysis.png';
import { useToast } from '@/shared/ui/toast';

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNotificationIconSrc(notification: NotificationItem) {
  const type = notification.type.toLowerCase();
  const title = notification.title.toLowerCase();

  if (title.includes('채팅 요청') || type.includes('chat_request') || type.includes('request')) {
    return notificationChatRequest;
  }
  if (title.includes('메시지') || type.includes('message') || type.includes('chat')) {
    return notificationMessage;
  }
  if (title.includes('이력서') || type.includes('resume')) {
    return notificationResumeAnalysis;
  }

  return notificationMessage;
}

function sanitizeNotificationContent(content: string) {
  return content.replace(/\s*\(task_id:[^)]+\)\s*$/i, '').trim();
}

export default function NotificationPage() {
  const router = useRouter();
  const { status: authStatus } = useAuthStatus();
  const isAuthed = authStatus === 'authed';
  const { pushToast } = useToast();
  const { initFcm } = useFcmLifecycle();
  const notificationsQuery = useNotificationsQuery(isAuthed);
  const readAllMutation = useReadAllNotificationsMutation();
  const readOneMutation = useReadNotificationMutation();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!notificationsQuery.data) return [];
    return notificationsQuery.data.pages.flatMap((page) => page.notifications);
  }, [notificationsQuery.data]);

  const unreadCount = notificationsQuery.data?.pages[0]?.unread_count ?? 0;

  const syncPushEnabled = useCallback(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
    const hasStoredToken = Boolean(readStoredFcmToken());
    setPushEnabled(Notification.permission === 'granted' && hasStoredToken);
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setPushEnabled(false);
      return;
    }

    syncPushEnabled();
    window.addEventListener('focus', syncPushEnabled);
    window.addEventListener('storage', syncPushEnabled);

    return () => {
      window.removeEventListener('focus', syncPushEnabled);
      window.removeEventListener('storage', syncPushEnabled);
    };
  }, [isAuthed, syncPushEnabled]);

  const handleTogglePush = async () => {
    if (isTogglingPush) return;
    if (!isAuthed) {
      pushToast('로그인 후 이용해주세요.');
      return;
    }

    setIsTogglingPush(true);
    try {
      if (pushEnabled) {
        await removeRegisteredFcmToken();
        setPushEnabled(false);
        pushToast('푸시 알림을 해제했습니다.');
        return;
      }

      await initFcm();
      const token = readStoredFcmToken();
      if (token) {
        setPushEnabled(true);
        pushToast('푸시 알림 등록', { variant: 'success' });
        return;
      }

      const isIos =
        typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone =
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(display-mode: standalone)').matches ||
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

      if (isIos && !isStandalone) {
        pushToast('iOS는 홈 화면에 추가한 앱(PWA)에서만 알림 토큰 발급이 가능합니다.');
      } else {
        pushToast('토큰 발급에 실패했습니다. 브라우저 알림 권한을 확인해주세요.');
      }
      setPushEnabled(false);
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleIssueToken = async () => {
    await initFcm();
    const token = readStoredFcmToken();
    setDeviceToken(token);

    if (token) {
      pushToast('디바이스 토큰을 발급하고 등록했습니다.', { variant: 'success' });
      return;
    }

    const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(display-mode: standalone)').matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (isIos && !isStandalone) {
      pushToast('iOS는 홈 화면에 추가한 앱(PWA)에서만 알림 토큰 발급이 가능합니다.');
      return;
    }

    pushToast('토큰 발급에 실패했습니다. 브라우저 알림 권한을 확인해주세요.');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-2.5 pb-[calc(var(--app-footer-height)+16px)] pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600"
              aria-label="뒤로 가기"
            >
              <svg
                data-slot="icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="rounded-full border border-[#bcd1f5] bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#2b4b7e] disabled:opacity-50"
            >
              전체 읽음
            </button>
          ) : null}
        </div>
        <div className="sticky top-[calc(var(--app-header-height)+10px)] z-20 mt-3">
          <div
            className="mx-auto w-[92%]"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 64,
              borderRadius: 24,
              border: '1px solid #e8e8ed',
              background: 'rgba(255,255,255,0.65)',
              padding: '10px 16px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                minWidth: 0,
                flex: 1,
                paddingLeft: 8,
                paddingRight: 12,
                color: '#101114',
                fontSize: 18,
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              푸시 알림 허용
            </span>
            <button
              type="button"
              onClick={() => {
                void handleTogglePush();
              }}
              aria-label="알림 허용 토글"
              aria-pressed={pushEnabled}
              disabled={isTogglingPush}
              style={
                pushEnabled
                  ? {
                      width: 62,
                      height: 36,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 9999,
                      padding: 2,
                      background: 'var(--color-primary-main)',
                      opacity: isTogglingPush ? 0.8 : 1,
                      transition: 'background-color 150ms ease',
                    }
                  : {
                      width: 62,
                      height: 36,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 9999,
                      padding: 2,
                      background: '#bfc8d1',
                      opacity: isTogglingPush ? 0.8 : 1,
                      transition: 'background-color 150ms ease',
                    }
              }
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  background: '#fff',
                  transform: pushEnabled ? 'translateX(26px)' : 'translateX(0px)',
                  transition: 'transform 180ms ease',
                }}
              />
            </button>
          </div>
        </div>
        {!isAuthed ? (
          <p className="mt-6 rounded-2xl bg-white py-10 text-center text-sm text-text-caption shadow-sm">
            로그인 후 알림을 확인할 수 있어요.
          </p>
        ) : notificationsQuery.isLoading ? (
          <p className="mt-6 rounded-2xl bg-white py-10 text-center text-sm text-text-caption shadow-sm">
            알림을 불러오는 중...
          </p>
        ) : notifications.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white py-10 text-center text-sm text-text-caption shadow-sm">
            도착한 알림이 없어요.
          </p>
        ) : (
          <div className="mt-2 flex flex-col">
            {notifications.map((notification) => (
              <button
                key={notification.notification_id}
                type="button"
                onClick={() => {
                  if (notification.is_read || readOneMutation.isPending) return;
                  readOneMutation.mutate(notification.notification_id);
                }}
                className="w-full px-2 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                    <Image
                      src={getNotificationIconSrc(notification)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 break-words text-[14px] font-semibold leading-tight text-[#4a5568]">
                      {notification.title}
                    </p>
                    <p className="mt-1 line-clamp-2 break-words text-[12px] font-medium leading-snug text-[#4a5568]">
                      {sanitizeNotificationContent(notification.content)}
                    </p>
                  </div>
                  <div className="ml-2 flex w-[72px] shrink-0 flex-col items-end justify-center gap-2">
                    <p className="text-right text-[12px] leading-tight text-[#8a94a4]">
                      {formatNotificationDate(notification.created_at)}
                    </p>
                    {!notification.is_read ? (
                      <span className="rounded-xl bg-[#d9e7ff] px-2 py-0.5 text-[12px] font-semibold text-[#2760c4]">
                        NEW
                      </span>
                    ) : null}
                  </div>
                </div>
                {!notification.is_read ? (
                  <div className="mt-3 h-px w-full bg-[#cfe0ff]" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        )}
        {notifications.length > 0 && notificationsQuery.hasNextPage ? (
          <button
            type="button"
            onClick={() => notificationsQuery.fetchNextPage()}
            disabled={notificationsQuery.isFetchingNextPage}
            className="mt-3 rounded-xl border border-[#d8dde7] bg-white py-2 text-sm font-semibold text-[#35558b] disabled:opacity-50"
          >
            {notificationsQuery.isFetchingNextPage ? '불러오는 중...' : '더 보기'}
          </button>
        ) : null}
      </section>

      <Footer />
    </div>
  );
}
