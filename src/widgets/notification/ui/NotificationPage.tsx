'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStatus } from '@/entities/auth';
import {
  useNotificationsQuery,
  useReadAllNotificationsMutation,
  useReadNotificationMutation,
  type NotificationItem,
} from '@/entities/notification';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { readStoredFcmToken } from '@/features/notification-fcm';
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
  const { pushToast } = useToast();
  const { status: authStatus } = useAuthStatus();
  const isAuthed = authStatus === 'authed';
  const notificationsQuery = useNotificationsQuery(isAuthed);
  const readAllMutation = useReadAllNotificationsMutation();
  const readOneMutation = useReadNotificationMutation();
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!notificationsQuery.data) return [];
    return notificationsQuery.data.pages.flatMap((page) => page.notifications);
  }, [notificationsQuery.data]);

  const unreadCount = notificationsQuery.data?.pages[0]?.unread_count ?? 0;

  const handleShowToken = () => {
    const token = readStoredFcmToken();
    setDeviceToken(token);
    if (!token) {
      pushToast('저장된 디바이스 토큰이 없습니다.');
      return;
    }
    pushToast('디바이스 토큰을 불러왔습니다.', { variant: 'success' });
  };

  const handleCopyToken = async () => {
    if (!deviceToken) return;
    await navigator.clipboard.writeText(deviceToken).catch(() => null);
    pushToast('디바이스 토큰을 복사했습니다.', { variant: 'success' });
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
        {isAuthed ? (
          <div className="mt-2 rounded-xl border border-[#d7e3f8] bg-[#f3f7ff] p-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShowToken}
                className="rounded-lg bg-[#35558b] px-3 py-1.5 text-xs font-semibold text-white"
              >
                토큰 보기
              </button>
              {deviceToken ? (
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="rounded-lg border border-[#35558b] px-3 py-1.5 text-xs font-semibold text-[#35558b]"
                >
                  토큰 복사
                </button>
              ) : null}
            </div>
            {deviceToken ? (
              <p className="mt-2 break-all rounded-md bg-white p-2 text-[11px] text-[#3b4f6f]">
                {deviceToken}
              </p>
            ) : null}
          </div>
        ) : null}

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
