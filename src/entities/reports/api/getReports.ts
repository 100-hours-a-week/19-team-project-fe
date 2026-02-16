import { apiFetch } from '@/shared/api';

export type ReportSummary = {
  reportId: number;
  title: string;
  status: string;
  chatRoomId: number;
  resumeId: number;
  jobPostUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportsListData = {
  reports: ReportSummary[];
};

export async function getReports(): Promise<ReportsListData> {
  const data = await apiFetch<ReportsListData>('/bff/reports', { method: 'GET' });
  return {
    reports: (data.reports ?? []).map((report) => normalizeReportSummary(report)),
  };
}

function normalizeReportSummary(raw: ReportSummary): ReportSummary {
  const snake = raw as ReportSummary & {
    report_id?: number;
    chat_room_id?: number;
    resume_id?: number;
    job_post_url?: string;
    created_at?: string;
    updated_at?: string;
  };

  return {
    reportId: raw.reportId ?? snake.report_id ?? 0,
    title: raw.title ?? '',
    status: raw.status ?? '',
    chatRoomId: raw.chatRoomId ?? snake.chat_room_id ?? 0,
    resumeId: raw.resumeId ?? snake.resume_id ?? 0,
    jobPostUrl: raw.jobPostUrl ?? snake.job_post_url ?? '',
    createdAt: raw.createdAt ?? snake.created_at ?? '',
    updatedAt: raw.updatedAt ?? snake.updated_at ?? '',
  };
}
