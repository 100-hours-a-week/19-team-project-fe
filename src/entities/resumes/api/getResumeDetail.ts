import { apiFetch } from '@/shared/api';

export type ResumeDetail = {
  resumeId: number;
  title: string;
  isFresher: boolean;
  educationLevel: string;
  fileUrl: string;
  contentJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type ResumeDetailApiResponse = {
  resumeId?: number;
  resume_id?: number;
  title?: string;
  isFresher?: boolean;
  is_fresher?: boolean;
  educationLevel?: string;
  education_level?: string;
  fileUrl?: string;
  file_url?: string;
  contentJson?: Record<string, unknown> | null;
  content_json?: Record<string, unknown> | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

const normalizeResumeDetail = (resume: ResumeDetailApiResponse): ResumeDetail => {
  return {
    resumeId: resume.resumeId ?? resume.resume_id ?? 0,
    title: resume.title ?? '',
    isFresher: resume.isFresher ?? resume.is_fresher ?? false,
    educationLevel: resume.educationLevel ?? resume.education_level ?? '',
    fileUrl: resume.fileUrl ?? resume.file_url ?? '',
    contentJson: resume.contentJson ?? resume.content_json ?? null,
    createdAt: resume.createdAt ?? resume.created_at ?? '',
    updatedAt: resume.updatedAt ?? resume.updated_at ?? '',
  };
};

export async function getResumeDetail(resumeId: number): Promise<ResumeDetail> {
  const data = await apiFetch<ResumeDetailApiResponse>(`/bff/resumes/${resumeId}`);
  return normalizeResumeDetail(data);
}
