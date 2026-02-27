import { apiFetch } from '@/shared/api';

export type ResumeParseTaskRequest = {
  file_url: string;
};

export type ResumeParseProject = {
  title?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

export type ResumeParseCareer = {
  company?: string;
  position?: string;
  job?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
};

export type ResumeParseContentJson = {
  careers?: (string | ResumeParseCareer)[];
  projects?: ResumeParseProject[];
  education?: string[];
  awards?: string[];
  certificates?: string[];
  activities?: string[];
};

export type ResumeParseTaskResult = {
  isFresher?: boolean;
  educationLevel?: string;
  contentJson?: ResumeParseContentJson;
  rawTextExcerpt?: string;
  is_fresher?: boolean;
  education_level?: string;
  content_json?: ResumeParseContentJson;
  raw_text_excerpt?: string;
};

type ResumeParseTaskApiData = {
  taskId?: string;
  task_id?: string;
  status: string;
  result: ResumeParseTaskResult | null;
};

export type ResumeParseTaskData = {
  taskId: string;
  status: string;
  result: ResumeParseTaskResult | null;
};

const normalizeResult = (result: ResumeParseTaskResult): ResumeParseTaskResult => ({
  is_fresher: result.is_fresher ?? result.isFresher,
  education_level: result.education_level ?? result.educationLevel,
  content_json: result.content_json ?? result.contentJson,
  raw_text_excerpt: result.raw_text_excerpt ?? result.rawTextExcerpt,
});

const normalizeTaskData = (data: ResumeParseTaskApiData): ResumeParseTaskData => ({
  taskId: data.taskId ?? data.task_id ?? '',
  status: data.status ?? 'PROCESSING',
  result: data.result ? normalizeResult(data.result) : null,
});

export async function parseResumeTask(
  payload: ResumeParseTaskRequest,
): Promise<ResumeParseTaskData> {
  const data = await apiFetch<ResumeParseTaskApiData>('/bff/resumes/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return normalizeTaskData(data);
}

export async function getResumeParseTask(taskId: string): Promise<ResumeParseTaskData> {
  const encodedTaskId = encodeURIComponent(taskId);
  const data = await apiFetch<ResumeParseTaskApiData>(`/bff/resumes/tasks/${encodedTaskId}`);
  return normalizeTaskData(data);
}
