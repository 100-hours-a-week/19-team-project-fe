import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ChatDetailData, ChatRequestType } from '@/entities/chat';
import type { ResumeDetail } from '@/entities/resumes';
import { normalizeResumeContent, normalizeResumeDetail, toStringArray } from '@/entities/resumes';

export function useChatDetail(
  chatId: number,
  detail: ChatDetailData,
  fallbackRequestType?: ChatRequestType | null,
) {
  const router = useRouter();
  const [status] = useState(detail.status);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const isClosed = useMemo(() => status === 'CLOSED', [status]);
  const requestType = resolveRequestType(detail, fallbackRequestType);
  const isFeedbackChat = requestType === 'FEEDBACK';

  const resumeSource =
    detail.resume ??
    (detail as { resume_detail?: ChatDetailData['resume'] | null }).resume_detail ??
    (detail as { resumeDetail?: ChatDetailData['resume'] | null }).resumeDetail ??
    null;
  const resumeDetail: ResumeDetail | null = resumeSource
    ? normalizeResumeDetail(resumeSource)
    : null;

  const handleCloseChat = () => {
    if (isClosed) return;
    router.push(`/chat/${chatId}/feedback`);
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
    isClosing: false,
    isFeedbackChat,
    closeError: null,
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
  const extended = detail as ChatDetailData & {
    requestType?: unknown;
    type?: unknown;
    chat_request?: { request_type?: unknown; requestType?: unknown; type?: unknown } | null;
    chatRequest?: { request_type?: unknown; requestType?: unknown; type?: unknown } | null;
  };

  return (
    normalizeRequestType(detail.request_type) ??
    normalizeRequestType(extended.requestType) ??
    normalizeRequestType(extended.type) ??
    normalizeRequestType(extended.chat_request?.request_type) ??
    normalizeRequestType(extended.chat_request?.requestType) ??
    normalizeRequestType(extended.chat_request?.type) ??
    normalizeRequestType(extended.chatRequest?.request_type) ??
    normalizeRequestType(extended.chatRequest?.requestType) ??
    normalizeRequestType(extended.chatRequest?.type) ??
    normalizeRequestType(fallbackRequestType) ??
    null
  );
}
