import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ChatDetailData } from '@/entities/chat';
import type { ResumeDetail } from '@/entities/resumes';
import { closeChat } from '@/features/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

export type ResumeContent = {
  summary?: string;
  careers?: string[];
  projects?: Array<{
    title?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  education?: string[];
  awards?: string[];
  certificates?: string[];
  activities?: string[];
};

const normalizeContent = (value: ResumeDetail['contentJson']): ResumeContent | null => {
  if (!value || typeof value !== 'object') return null;
  return value as ResumeContent;
};

const toArray = (value?: string[]) => (Array.isArray(value) ? value.filter(Boolean) : []);

type ResumeLike = NonNullable<ChatDetailData['resume']> & {
  resumeDetail?: NonNullable<ChatDetailData['resume']>;
  resume_detail?: NonNullable<ChatDetailData['resume']>;
};

const normalizeResumeDetail = (resume: ResumeLike): ResumeDetail => ({
  resumeId: resume.resumeId ?? resume.resume_id ?? 0,
  title: resume.title ?? '',
  isFresher: resume.isFresher ?? resume.is_fresher ?? false,
  educationLevel: resume.educationLevel ?? resume.education_level ?? '',
  fileUrl: resume.fileUrl ?? resume.file_url ?? '',
  contentJson: resume.contentJson ?? resume.content_json ?? null,
  createdAt: resume.createdAt ?? resume.created_at ?? '',
  updatedAt: resume.updatedAt ?? resume.updated_at ?? '',
});

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
    (detail as { resume_detail?: ResumeLike | null }).resume_detail ??
    (detail as { resumeDetail?: ResumeLike | null }).resumeDetail ??
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

  const content = normalizeContent(resumeDetail?.contentJson ?? null);
  const careers = toArray(content?.careers);
  const projects = Array.isArray(content?.projects) ? (content?.projects ?? []) : [];
  const education = toArray(content?.education);
  const awards = toArray(content?.awards);
  const certificates = toArray(content?.certificates);
  const activities = toArray(content?.activities);
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
