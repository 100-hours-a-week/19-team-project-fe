import type { ResumeDetail } from '@/entities/resumes';
import type { ChatDetailData } from '@/entities/chat';

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

type ResumeLike = NonNullable<ChatDetailData['resume']> & {
  resumeDetail?: NonNullable<ChatDetailData['resume']>;
  resume_detail?: NonNullable<ChatDetailData['resume']>;
};

export const normalizeResumeDetail = (resume: ResumeLike): ResumeDetail => ({
  resumeId: resume.resumeId ?? resume.resume_id ?? 0,
  title: resume.title ?? '',
  isFresher: resume.isFresher ?? resume.is_fresher ?? false,
  educationLevel: resume.educationLevel ?? resume.education_level ?? '',
  fileUrl: resume.fileUrl ?? resume.file_url ?? '',
  contentJson: resume.contentJson ?? resume.content_json ?? null,
  createdAt: resume.createdAt ?? resume.created_at ?? '',
  updatedAt: resume.updatedAt ?? resume.updated_at ?? '',
});

export const normalizeResumeContent = (
  value: ResumeDetail['contentJson'],
): ResumeContent | null => {
  if (!value || typeof value !== 'object') return null;
  return value as ResumeContent;
};

export const toStringArray = (value?: string[]) =>
  Array.isArray(value) ? value.filter(Boolean) : [];
