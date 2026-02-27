import type { ResumeDetail } from '../api/getResumeDetail';

export type ResumeContent = {
  summary?: unknown;
  careers?: unknown;
  projects?: unknown;
  education?: unknown;
  awards?: unknown;
  certificates?: unknown;
  activities?: unknown;
};

export type ResumeProjectItem = {
  title?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

type ResumeLike = {
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
  resumeDetail?: ResumeLike;
  resume_detail?: ResumeLike;
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as ResumeContent;
};

const readString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const toDisplayText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    const company = readString(item.company) || readString(item.company_name);
    const role = readString(item.job);
    const position = readString(item.position);
    const startDate = readString(item.start_date);
    const endDate = readString(item.end_date);
    const period = [startDate, endDate].filter(Boolean).join(' - ');

    const careerText = [company, period, role, position].filter(Boolean).join(' | ');
    if (careerText) return careerText;

    const title = readString(item.title);
    const description = readString(item.description);
    const fallback = [title, description].filter(Boolean).join(' - ');
    return fallback || null;
  }
  return null;
};

export const toSafeTrimmedString = (value: unknown) => {
  const text = toDisplayText(value);
  return text ?? '';
};

export const toStringArray = (value?: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<string[]>((acc, item) => {
    const text = toDisplayText(item);
    if (text) acc.push(text);
    return acc;
  }, []);
};

export function toProjectArray(value?: unknown): ResumeProjectItem[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<ResumeProjectItem[]>((acc, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return acc;
    const project = item as Record<string, unknown>;
    const title = readString(project.title);
    const startDate = readString(project.start_date);
    const endDate = readString(project.end_date);
    const description = readString(project.description);
    acc.push({
      title: title || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      description: description || undefined,
    });
    return acc;
  }, []);
}
