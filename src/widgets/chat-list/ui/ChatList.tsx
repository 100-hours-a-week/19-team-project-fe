'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { getChatList } from '@/features/chat';
import type { ChatSummary } from '@/entities/chat';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

const pad2 = (value: number) => value.toString().padStart(2, '0');

const formatChatTime = (value?: string | null) => {
  if (!value) return '';
  const normalized = value.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const now = new Date();
  const isToday =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  if (!isToday) {
    return `${pad2(parsed.getMonth() + 1)}.${pad2(parsed.getDate())}`;
  }

  const hours = parsed.getHours();
  const minutes = pad2(parsed.getMinutes());
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = pad2(hours % 12 === 0 ? 12 : hours % 12);

  return `${period} ${displayHours}:${minutes}`;
};

export default function ChatList() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authed' | 'guest'>('checking');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const auth = await getMe();
        if (cancelled) return;
        if (!auth.authenticated) {
          setAuthStatus('guest');
          setIsLoading(false);
          return;
        }

        setAuthStatus('authed');
        const data = await getChatList();
        if (cancelled) return;
        alert(JSON.stringify(data, null, 2));
        const normalized = data.chats
          .map((chat) => {
            const rawChatId = chat.chat_id ?? chat.chatId ?? null;
            const parsedChatId = typeof rawChatId === 'string' ? Number(rawChatId) : rawChatId;
            const chatId =
              typeof parsedChatId === 'number' && !Number.isNaN(parsedChatId) ? parsedChatId : null;

            if (chatId === null) return null;
            return {
              ...chat,
              chat_id: chatId,
            };
          })
          .filter((chat): chat is ChatSummary => !!chat);
        setChats(normalized);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : '채팅 목록을 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <div className="fixed top-0 left-1/2 z-10 flex h-app-header w-full max-w-[600px] -translate-x-1/2 items-center bg-[#f7f7f7] px-6">
        <h1 className="text-2xl font-semibold">채팅</h1>
      </div>

      <section className="px-6 pt-[calc(var(--app-header-height)+24px)]">
        <div className="flex items-center justify-between rounded-3xl bg-neutral-100 px-6 py-5 text-black">
          <div>
            <p className="text-lg font-semibold">[채팅 소개] 간단한 채팅 소개</p>
            <p className="mt-2 text-sm text-neutral-500">쌈뽕한 멘트 추가</p>
          </div>
          <div className="h-20 w-20 rounded-2xl bg-neutral-200" />
        </div>
      </section>

      <ul className="mt-4 flex flex-1 flex-col gap-1 px-2 pb-[calc(var(--app-footer-height)+16px)]">
        {authStatus === 'guest' ? (
          <li className="px-4 py-6 text-center text-sm text-neutral-500">로그인이 필요합니다.</li>
        ) : isLoading ? (
          <li className="px-4 py-6 text-center text-sm text-neutral-500">불러오는 중...</li>
        ) : loadError ? (
          <li className="px-4 py-6 text-center text-sm text-red-500">{loadError}</li>
        ) : chats.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-neutral-500">아직 채팅이 없습니다.</li>
        ) : (
          chats.map((chat) => {
            const lastMessage = chat.last_message;
            return (
              <li key={chat.chat_id}>
                <Link
                  href={`/chat/${chat.chat_id}`}
                  className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition hover:bg-neutral-100"
                >
                  <div className="h-12 w-12 flex-shrink-0 rounded-full bg-neutral-200" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold">{chat.receiver.nickname}</div>
                    <div className="mt-1 truncate text-sm text-neutral-500">
                      {lastMessage?.content ?? '대화를 시작해 보세요.'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs text-neutral-400">
                    <span>{lastMessage ? formatChatTime(lastMessage.created_at) : ''}</span>
                    {chat.unread_count > 0 ? (
                      <span className="rounded-full bg-[var(--color-primary-main)] px-2 py-1 text-[11px] font-semibold text-white">
                        {chat.unread_count}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>

      <BottomSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        onClose={handleAuthSheetClose}
      >
        <div className="flex h-full flex-col gap-4">
          <div>
            <p className="mt-2 text-sm text-text-caption">채팅을 보려면 로그인해 주세요.</p>
          </div>
          <div className="mt-auto">
            <KakaoLoginButton />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
