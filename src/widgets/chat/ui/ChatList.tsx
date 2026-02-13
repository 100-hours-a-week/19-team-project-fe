'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { KakaoLoginButton } from '@/features/auth';
import { Header } from '@/widgets/header';
import { useChatList, useChatRequestList, updateChatRequestStatus } from '@/features/chat';
import type { ChatSummary } from '@/entities/chat';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { Modal } from '@/shared/ui/modal';
import { useToast } from '@/shared/ui/toast';
import charIcon from '@/shared/icons/char_icon.png';
import ChatRequestSuccessAnimation from './ChatRequestSuccessAnimation';

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

const formatUnreadCount = (value?: number | null) => {
  if (!value || value <= 0) return '';
  return value > 99 ? '99+' : String(value);
};

const getCounterparty = (chat: ChatSummary, currentUserId: number | null) => {
  if (currentUserId && chat.requester.user_id === currentUserId) {
    return chat.receiver;
  }
  if (currentUserId && chat.receiver.user_id === currentUserId) {
    return chat.requester;
  }
  return chat.receiver;
};

export default function ChatList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authStatus, chats, currentUser, isLoading, loadingMore, hasMore, loadMore, loadError } =
    useChatList();
  const {
    requests: receivedRequests,
    isLoading: isReceivedLoading,
    loadError: receivedLoadError,
    setRequests: setReceivedRequests,
  } = useChatRequestList({ direction: 'received', status: 'PENDING', size: 5 });
  const {
    requests: sentRequests,
    isLoading: isSentLoading,
    loadError: sentLoadError,
  } = useChatRequestList({ direction: 'sent', status: 'PENDING', size: 5 });
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<'chats' | 'received' | 'sent'>('chats');
  const listRef = useRef<HTMLUListElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<'ACCEPTED' | 'REJECTED' | null>(null);

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  const formatRequestType = (type?: string) => {
    if (type === 'COFFEE_CHAT') return '커피챗';
    if (type === 'FEEDBACK') return '피드백';
    return '채팅 요청';
  };

  const chatUnreadCount = chats.reduce((sum, chat) => sum + (chat.unread_count ?? 0), 0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const isExpert = currentUser?.user_type === 'EXPERT';
    if (tab === 'sent') {
      setActiveTab('sent');
      return;
    }
    if (tab === 'received' && isExpert) {
      setActiveTab('received');
      return;
    }
    setActiveTab('chats');
  }, [currentUser?.user_type, searchParams]);

  const [requestActionLoading, setRequestActionLoading] = useState<Record<number, boolean>>({});

  const handleRequestAction = async (requestId: number, status: 'ACCEPTED' | 'REJECTED') => {
    if (requestActionLoading[requestId]) return;
    setRequestActionLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const data = await updateChatRequestStatus({ requestId, status });
      setReceivedRequests((prev) => prev.filter((item) => item.chat_request_id !== requestId));
      if (status === 'ACCEPTED' && data.chat_id) {
        router.push(`/chat/${data.chat_id}`);
        return;
      }
      pushToast(status === 'ACCEPTED' ? '요청을 수락했습니다.' : '요청을 거절했습니다.');
    } catch (error) {
      console.error('[Chat Request Update Error]', error);
      pushToast('요청 처리에 실패했습니다.');
    } finally {
      setRequestActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const openConfirm = (requestId: number, action: 'ACCEPTED' | 'REJECTED') => {
    setPendingRequestId(requestId);
    setPendingAction(action);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingRequestId || !pendingAction) return;
    setConfirmOpen(false);
    await handleRequestAction(pendingRequestId, pendingAction);
  };

  const handleChatScroll = () => {
    if (activeTab !== 'chats') return;
    if (!hasMore || loadingMore) return;
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop <= 0) return;
    const remaining = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (remaining < 200) {
      void loadMore();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f7f7f7] text-black">
      <ChatRequestSuccessAnimation />
      <Header />

      <section className="px-4 pt-6">
        <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-5 text-black shadow-sm">
          <div>
            <p className="text-lg font-semibold">막연한 고민</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              현직자와 채팅으로 정리하세요
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center">
            <Image src={charIcon} alt="채팅 안내" className="h-20 w-20 object-contain" />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'chats'
                  ? 'border-primary-main bg-primary-main/10 text-primary-main'
                  : 'border-neutral-200 bg-white text-neutral-500'
              }`}
            >
              채팅
              {chatUnreadCount > 0 ? (
                <span className="rounded-full bg-primary-main px-2 py-0.5 text-xs font-semibold text-white">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              ) : null}
            </button>
            {currentUser?.user_type === 'EXPERT' ? (
              <button
                type="button"
                onClick={() => setActiveTab('received')}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'received'
                    ? 'border-primary-main bg-primary-main/10 text-primary-main'
                    : 'border-neutral-200 bg-white text-neutral-500'
                }`}
              >
                받은 요청
                {receivedRequests.length > 0 ? (
                  <span className="rounded-full bg-primary-main px-2 py-0.5 text-xs font-semibold text-white">
                    {receivedRequests.length > 99 ? '99+' : receivedRequests.length}
                  </span>
                ) : null}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTab('sent')}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'sent'
                  ? 'border-primary-main bg-primary-main/10 text-primary-main'
                  : 'border-neutral-200 bg-white text-neutral-500'
              }`}
            >
              {currentUser?.user_type === 'EXPERT' ? '보낸 요청' : '요청 중'}
              {sentRequests.length > 0 ? (
                <span className="rounded-full bg-primary-main px-2 py-0.5 text-xs font-semibold text-white">
                  {sentRequests.length > 99 ? '99+' : sentRequests.length}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </section>

      {activeTab === 'received' ? (
        <ul className="mt-4 flex flex-1 min-h-0 flex-col gap-1 overflow-y-auto px-4 pb-[calc(var(--app-footer-height)+16px)]">
          {authStatus === 'guest' ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">
              로그인이 필요합니다.
            </li>
          ) : isReceivedLoading ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">불러오는 중...</li>
          ) : receivedLoadError ? (
            <li className="px-2.5 py-6 text-center text-sm text-red-500">{receivedLoadError}</li>
          ) : receivedRequests.length === 0 ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">
              아직 받은 요청이 없습니다.
            </li>
          ) : (
            receivedRequests.map((request) => {
              const counterpart = request.requester;
              return (
                <li key={request.chat_request_id} className="border-b border-neutral-200/70">
                  <div className="flex w-full items-center gap-4 rounded-2xl px-2.5 py-4">
                    <Image
                      src={counterpart.profile_image_url ?? charIcon}
                      alt={`${counterpart.nickname} 프로필`}
                      width={48}
                      height={48}
                      unoptimized={!!counterpart.profile_image_url}
                      className="h-12 w-12 flex-shrink-0 rounded-full object-cover bg-neutral-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-base font-semibold">
                          {counterpart.nickname}
                        </div>
                        <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                          {formatRequestType(request.request_type)}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-sm text-neutral-500">
                        요청일 {formatChatTime(request.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openConfirm(request.chat_request_id, 'REJECTED')}
                        disabled={requestActionLoading[request.chat_request_id]}
                        className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 disabled:opacity-50"
                      >
                        거절
                      </button>
                      <button
                        type="button"
                        onClick={() => openConfirm(request.chat_request_id, 'ACCEPTED')}
                        disabled={requestActionLoading[request.chat_request_id]}
                        className="rounded-full bg-primary-main px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        수락
                      </button>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      ) : activeTab === 'sent' ? (
        <ul className="mt-4 flex flex-1 min-h-0 flex-col gap-1 overflow-y-auto px-4 pb-[calc(var(--app-footer-height)+16px)]">
          {authStatus === 'guest' ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">
              로그인이 필요합니다.
            </li>
          ) : isSentLoading ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">불러오는 중...</li>
          ) : sentLoadError ? (
            <li className="px-2.5 py-6 text-center text-sm text-red-500">{sentLoadError}</li>
          ) : sentRequests.length === 0 ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">
              아직 보낸 요청이 없습니다.
            </li>
          ) : (
            sentRequests.map((request) => {
              const counterpart = request.receiver;
              return (
                <li key={request.chat_request_id} className="border-b border-neutral-200/70">
                  <div className="flex w-full items-center gap-4 rounded-2xl px-2.5 py-4">
                    <Image
                      src={counterpart.profile_image_url ?? charIcon}
                      alt={`${counterpart.nickname} 프로필`}
                      width={48}
                      height={48}
                      unoptimized={!!counterpart.profile_image_url}
                      className="h-12 w-12 flex-shrink-0 rounded-full object-cover bg-neutral-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-base font-semibold">
                          {counterpart.nickname}
                        </div>
                        <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                          {formatRequestType(request.request_type)}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                          요청 중
                        </span>
                      </div>
                      <div className="mt-1 truncate text-sm text-neutral-500">
                        요청일 {formatChatTime(request.created_at)}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      ) : (
        <ul
          ref={listRef}
          onScroll={handleChatScroll}
          className="mt-4 flex flex-1 min-h-0 flex-col gap-1 overflow-y-auto px-4 pb-[calc(var(--app-footer-height)+16px)]"
        >
          {authStatus === 'guest' ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">
              로그인이 필요합니다.
            </li>
          ) : isLoading ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">불러오는 중...</li>
          ) : loadError ? (
            <li className="px-2.5 py-6 text-center text-sm text-red-500">{loadError}</li>
          ) : chats.length === 0 ? (
            <li className="px-2.5 py-6 text-center text-sm text-neutral-500">
              아직 채팅이 없습니다.
            </li>
          ) : (
            <>
              {chats.map((chat) => {
                const counterparty = getCounterparty(chat, currentUser?.id ?? null);
                const lastMessage = chat.last_message;
                const showUnread = chat.unread_count > 0;
                return (
                  <li key={chat.chat_id} className="border-b border-neutral-200/70">
                    <Link
                      href={`/chat/${chat.chat_id}`}
                      className="flex w-full items-center gap-4 rounded-2xl px-2.5 py-4 text-left transition hover:bg-neutral-100"
                    >
                      <Image
                        src={counterparty.profile_image_url ?? charIcon}
                        alt={`${counterparty.nickname} 프로필`}
                        width={48}
                        height={48}
                        unoptimized={!!counterparty.profile_image_url}
                        className="h-12 w-12 flex-shrink-0 rounded-full object-cover bg-neutral-200"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-base font-semibold">
                            {counterparty.nickname}
                          </div>
                          {chat.request_type ? (
                            <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[11px] font-semibold text-[#2b4b7e]">
                              {formatRequestType(chat.request_type)}
                            </span>
                          ) : null}
                          {chat.status === 'CLOSED' ? (
                            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                              종료
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 truncate text-sm text-neutral-500">
                          {lastMessage?.content ?? '대화를 시작해 보세요.'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-xs text-neutral-400">
                        <span>
                          {lastMessage ? formatChatTime(lastMessage.last_message_at) : ''}
                        </span>
                        {showUnread ? (
                          <span className="flex min-w-6 items-center justify-center rounded-full bg-[var(--color-primary-main)] px-2 py-1 text-[13px] font-semibold text-white">
                            {formatUnreadCount(chat.unread_count)}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
              {loadingMore ? (
                <li className="py-4 text-center text-sm text-neutral-400">불러오는 중...</li>
              ) : hasMore ? (
                <li className="py-4 text-center text-sm text-neutral-400">더 불러오는 중...</li>
              ) : (
                <li className="py-4 text-center text-sm text-neutral-400">
                  더 불러올 채팅이 없습니다.
                </li>
              )}
            </>
          )}
        </ul>
      )}

      <AuthGateSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        description="채팅을 보려면 로그인해 주세요."
        onClose={handleAuthSheetClose}
      >
        <KakaoLoginButton />
      </AuthGateSheet>

      <Modal
        open={confirmOpen}
        title="요청 처리"
        description={
          pendingAction === 'ACCEPTED'
            ? '요청을 수락할까요?'
            : pendingAction === 'REJECTED'
              ? '요청을 거절할까요?'
              : null
        }
        confirmLabel="확인"
        cancelLabel="취소"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
