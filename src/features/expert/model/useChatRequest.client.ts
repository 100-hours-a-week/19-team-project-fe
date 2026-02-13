'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createChatRequest } from '@/features/chat';
import { getAuthStatus } from '@/entities/auth';
import type { ChatRequestType } from '@/entities/chat';
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

  const handleChatRequestClick = async (
    selectedResumeId: number | null,
    requestType: ChatRequestType,
  ) => {
    if (isCheckingAuth) return;
    if (isJobPostOverLimit) {
      pushToast('공고 링크는 최대 500자까지 입력할 수 있어요.', { variant: 'warning' });
      return;
    }
    setIsCheckingAuth(true);
    try {
      const auth = await getAuthStatus();
      if (!auth.authenticated) {
        setAuthSheetOpen(true);
        return;
      }
      await createChatRequest({
        receiver_id: userId,
        resume_id: selectedResumeId ?? null,
        job_post_url: jobPostUrl.trim() || null,
        request_type: requestType,
      });
      pushToast('채팅 요청이 전송되었습니다.', { variant: 'success' });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('chatRequestSuccess', 'true');
      }
      router.push('/chat?tab=sent');
    } catch (error) {
      if (
        error instanceof BusinessError &&
        (error.code === 'CHAT_REQUEST_ALREADY_EXISTS' || error.code === 'CONFLICT')
      ) {
        pushToast('이미 처리 대기 중인 채팅 요청이 있어요.', { variant: 'warning' });
        return;
      }
      if (error instanceof BusinessError && error.code === 'INVALID_REQUEST') {
        pushToast('본인에게는 요청할 수 없습니다.', { variant: 'warning' });
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
