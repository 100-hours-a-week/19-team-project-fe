import { apiFetch } from '@/shared/api';

export type Resume = {
  resumeId: number;
  title: string;
  isFresher: boolean;
  educationLevel: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type ResumesResponse = {
  resumes: Resume[];
};

type ResumeApiResponse = {
  resumeId?: number;
  resume_id?: number;
  title?: string;
  isFresher?: boolean;
  is_fresher?: boolean;
  educationLevel?: string;
  education_level?: string;
  fileUrl?: string;
  file_url?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

const normalizeResume = (resume: ResumeApiResponse, index: number): Resume => {
  const resumeId =
    typeof resume.resumeId === 'number'
      ? resume.resumeId
      : typeof resume.resume_id === 'number'
        ? resume.resume_id
        : index;

  return {
    resumeId,
    title: resume.title ?? '',
    isFresher: resume.isFresher ?? resume.is_fresher ?? false,
    educationLevel: resume.educationLevel ?? resume.education_level ?? '',
    fileUrl: resume.fileUrl ?? resume.file_url ?? '',
    createdAt: resume.createdAt ?? resume.created_at ?? '',
    updatedAt: resume.updatedAt ?? resume.updated_at ?? '',
  };
};

export async function getResumes(): Promise<ResumesResponse> {
  const data = await apiFetch<{ resumes?: ResumeApiResponse[] }>('/bff/resumes');
  return {
    resumes: (data.resumes ?? []).map(normalizeResume),
  };
}
