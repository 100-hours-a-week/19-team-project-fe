import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  normalizeRequestTypeFromUnknown,
  type ChatDetailData,
  type ChatRequestType,
} from '@/entities/chat';
import type { ResumeDetail } from '@/entities/resumes';
import { closeChat } from '@/features/chat';
import { useCommonApiErrorHandler } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';
import { normalizeResumeContent, normalizeResumeDetail, toStringArray } from '@/entities/resumes';

export function useChatDetail(
  chatId: number,
  detail: ChatDetailData,
  fallbackRequestType?: ChatRequestType | null,
) {
  const router = useRouter();
  const { pushToast } = useToast();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [status, setStatus] = useState(detail.status);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const isClosed = useMemo(() => status === 'CLOSED', [status]);
  const requestType = resolveRequestType(detail, fallbackRequestType);
  const isFeedbackChat = requestType === 'FEEDBACK';
  const isCoffeeChat = requestType === 'COFFEE_CHAT';

  const resumeSource =
    detail.resume ??
    (detail as { resume_detail?: ChatDetailData['resume'] | null }).resume_detail ??
    (detail as { resumeDetail?: ChatDetailData['resume'] | null }).resumeDetail ??
    null;
  const resumeDetail: ResumeDetail | null = resumeSource
    ? normalizeResumeDetail(resumeSource)
    : null;

  const handleCloseChat = async () => {
    if (isClosed) return;
    if (isClosing) return;
    setCloseError(null);

    if (isFeedbackChat) {
      router.push(`/chat/${chatId}/feedback`);
      return;
    }

    if (!isCoffeeChat) {
      setCloseError('채팅 유형을 확인할 수 없어 종료할 수 없습니다.');
      return;
    }

    setIsClosing(true);
    try {
      await closeChat({ chatId });
      setStatus('CLOSED');
      pushToast('채팅이 종료되었습니다.');
      router.replace('/chat');
    } catch (error) {
      const handled = await handleCommonApiError(error);
      if (!handled) {
        setCloseError(error instanceof Error ? error.message : '채팅 종료에 실패했습니다.');
      }
    } finally {
      setIsClosing(false);
    }
  };

  const content = normalizeResumeContent(resumeDetail?.contentJson ?? null);
  const careers = toStringArray(content?.careers);
  const projects = toProjects(content?.projects);
  const education = toStringArray(content?.education);
  const awards = toStringArray(content?.awards);
  const certificates = toStringArray(content?.certificates);
  const activities = toStringArray(content?.activities);
  const summary = toSafeSummary(content?.summary);
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
    isFeedbackChat,
    isCoffeeChat,
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

const toSafeSummary = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const toProjects = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.reduce<
    Array<{ title?: string; start_date?: string; end_date?: string; description?: string }>
  >((acc, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return acc;
    const project = item as Record<string, unknown>;
    const title = typeof project.title === 'string' ? project.title.trim() : '';
    const startDate = typeof project.start_date === 'string' ? project.start_date.trim() : '';
    const endDate = typeof project.end_date === 'string' ? project.end_date.trim() : '';
    const description = typeof project.description === 'string' ? project.description.trim() : '';
    acc.push({
      title: title || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      description: description || undefined,
    });
    return acc;
  }, []);
};

function normalizeRequestType(value: unknown): ChatRequestType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'FEEDBACK') return 'FEEDBACK';
  if (normalized === 'COFFEE_CHAT') return 'COFFEE_CHAT';
  return null;
}

function resolveRequestType(
  detail: ChatDetailData,
  fallbackRequestType?: ChatRequestType | null,
): ChatRequestType | null {
  return (
    normalizeRequestTypeFromUnknown(detail) ?? normalizeRequestType(fallbackRequestType) ?? null
  );
}
