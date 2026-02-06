import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ChatDetailData } from '@/entities/chat';
import type { ResumeDetail } from '@/entities/resumes';
import { normalizeResumeContent, normalizeResumeDetail, toStringArray } from '@/entities/resumes';
import { closeChat } from '@/features/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useChatDetail(chatId: number, detail: ChatDetailData) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [status, setStatus] = useState(detail.status);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const isClosed = useMemo(() => status === 'CLOSED', [status]);

  const resumeSource =
    detail.resume ??
    (detail as { resume_detail?: ChatDetailData['resume'] | null }).resume_detail ??
    (detail as { resumeDetail?: ChatDetailData['resume'] | null }).resumeDetail ??
    null;
  const resumeDetail: ResumeDetail | null = resumeSource
    ? normalizeResumeDetail(resumeSource)
    : null;

  const handleCloseChat = async () => {
    if (isClosed || isClosing) return;
    setIsClosing(true);
    setCloseError(null);
    try {
      await closeChat({ chatId });
      setStatus('CLOSED');
      router.replace('/chat');
    } catch (error) {
      if (await handleCommonApiError(error)) {
        return;
      }
      setCloseError(error instanceof Error ? error.message : '채팅방 종료에 실패했습니다.');
    } finally {
      setIsClosing(false);
    }
  };

  const content = normalizeResumeContent(resumeDetail?.contentJson ?? null);
  const careers = toStringArray(content?.careers);
  const projects = Array.isArray(content?.projects) ? (content?.projects ?? []) : [];
  const education = toStringArray(content?.education);
  const awards = toStringArray(content?.awards);
  const certificates = toStringArray(content?.certificates);
  const activities = toStringArray(content?.activities);
  const summary = content?.summary?.trim();
  const hasContent =
    Boolean(summary) ||
    careers.length > 0 ||
    projects.length > 0 ||
    education.length > 0 ||
    awards.length > 0 ||
    certificates.length > 0 ||
    activities.length > 0;

  return {
    status,
    isClosed,
    isClosing,
    closeError,
    isResumeModalOpen,
    setIsResumeModalOpen,
    handleCloseChat,
    resumeDetail,
    content,
    careers,
    projects,
    education,
    awards,
    certificates,
    activities,
    summary,
    hasContent,
  };
}
