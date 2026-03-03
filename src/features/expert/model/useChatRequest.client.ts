'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createChatRequest, validateJobPostCrawl } from '@/features/chat';
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

      const normalizedJobPostUrl = jobPostUrl.trim() || null;
      if (requestType === 'FEEDBACK') {
        if (!selectedResumeId) {
          pushToast('탐색형 채팅은 이력서 첨부가 필요해요.', { variant: 'warning' });
          return;
        }
        if (!normalizedJobPostUrl) {
          pushToast('탐색형 채팅은 공고 링크가 필요해요.', { variant: 'warning' });
          return;
        }

        try {
          const validation = await validateJobPostCrawl(normalizedJobPostUrl);
          if (!validation.crawlable) {
            pushToast(
              validation.message?.trim() ||
                '해당 공고 링크는 현재 크롤링할 수 없어 탐색형 채팅 요청이 불가능해요.',
              {
                variant: 'warning',
              },
            );
            return;
          }
        } catch (error) {
          if (
            error instanceof BusinessError &&
            (error.code === 'JOB_POST_PARSE_FAILED' || error.code === 'INVALID_REQUEST')
          ) {
            pushToast('유효한 공고 링크를 입력해 주세요.', { variant: 'warning' });
            return;
          }
          if (await handleCommonApiError(error)) {
            return;
          }
          console.error('[Job Post Validation Error]', error);
          pushToast('공고 링크 검증에 실패했습니다. 잠시 후 다시 시도해 주세요.', {
            variant: 'warning',
          });
          return;
        }
      }

      await createChatRequest({
        receiver_id: userId,
        resume_id: selectedResumeId ?? null,
        job_post_url: normalizedJobPostUrl,
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
      pushToast('채팅 요청에 실패했습니다.', { variant: 'warning' });
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
