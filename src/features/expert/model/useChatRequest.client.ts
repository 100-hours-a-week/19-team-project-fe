'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createChat, getChatList } from '@/features/chat';
import { getMe } from '@/features/auth';
import { BusinessError, useCommonApiErrorHandler } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';

export function useChatRequest(userId: number) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();
  const { pushToast } = useToast();
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [jobPostUrl, setJobPostUrl] = useState('');
  const wasJobPostOverLimit = useRef(false);

  const isJobPostOverLimit = jobPostUrl.trim().length > 500;
  if (isJobPostOverLimit && !wasJobPostOverLimit.current) {
    pushToast('공고 링크는 최대 500자까지 입력할 수 있어요.', { variant: 'warning' });
  }
  wasJobPostOverLimit.current = isJobPostOverLimit;

  const handleChatRequestClick = async (selectedResumeId: number | null) => {
    if (isCheckingAuth) return;
    if (isJobPostOverLimit) {
      pushToast('공고 링크는 최대 500자까지 입력할 수 있어요.', { variant: 'warning' });
      return;
    }
    setIsCheckingAuth(true);
    try {
      const auth = await getMe();
      if (!auth.authenticated) {
        setAuthSheetOpen(true);
        return;
      }
      const data = await createChat({
        receiver_id: userId,
        resume_id: selectedResumeId ?? null,
        job_post_url: jobPostUrl.trim() || null,
        request_type: 'COFFEE_CHAT',
      });
      router.push(`/chat/${data.chat_id}`);
    } catch (error) {
      if (
        error instanceof BusinessError &&
        (error.code === 'CHAT_ROOM_ALREADY_EXISTS' || error.code === 'CONFLICT')
      ) {
        try {
          const list = await getChatList({ status: 'ACTIVE' });
          const matched = list.chats.find(
            (chat) => chat.receiver.user_id === userId || chat.requester.user_id === userId,
          );
          if (matched) {
            router.push(`/chat/${matched.chat_id}`);
            return;
          }
        } catch (listError) {
          if (await handleCommonApiError(listError)) {
            return;
          }
          console.error('[Chat List Error]', listError);
        }
        alert('이미 채팅방이 존재하지만 이동할 수 없습니다.');
        return;
      }
      if (await handleCommonApiError(error)) {
        return;
      }
      console.error('[Chat Request Error]', error);
      alert('채팅 요청에 실패했습니다.');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return {
    authSheetOpen,
    setAuthSheetOpen,
    isCheckingAuth,
    jobPostUrl,
    setJobPostUrl,
    isJobPostOverLimit,
    handleChatRequestClick,
  };
}
