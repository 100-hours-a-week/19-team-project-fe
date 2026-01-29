import { apiFetch } from '@/shared/api';

export type ResumeParseSyncRequest = {
  file_url: string;
  mode: 'sync';
};

export type ResumeParseProject = {
  title?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

export type ResumeParseContentJson = {
  careers?: string[];
  projects?: ResumeParseProject[];
  education?: string[];
  awards?: string[];
  certificates?: string[];
  activities?: string[];
};

export type ResumeParseSyncResult = {
  is_fresher?: boolean;
  education_level?: string;
  content_json?: ResumeParseContentJson;
  raw_text_excerpt?: string;
};

export type ResumeParseSyncData = {
  task_id: string;
  status: string;
  result: ResumeParseSyncResult | null;
};

export async function parseResumeSync(
  payload: ResumeParseSyncRequest,
): Promise<ResumeParseSyncData> {
  return apiFetch<ResumeParseSyncData>('/bff/resumes/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
