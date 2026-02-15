import { apiFetch } from '@/shared/api';

export type ReportDetail = {
  reportId: number;
  userId: number;
  expertId: number;
  chatRoomId: number;
  chatFeedbackId: number;
  chatRequestId: number;
  resumeId: number;
  title: string;
  status: string;
  resultJson: unknown;
  jobPostUrl: string;
  createdAt: string;
  updatedAt: string;
};

export async function getReportDetail(reportId: number): Promise<ReportDetail> {
  const data = await apiFetch<ReportDetail>(`/bff/reports/${reportId}`, { method: 'GET' });
  const snake = data as ReportDetail & {
    report_id?: number;
    user_id?: number;
    expert_id?: number;
    chat_room_id?: number;
    chat_feedback_id?: number;
    chat_request_id?: number;
    resume_id?: number;
    result_json?: unknown;
    job_post_url?: string;
    created_at?: string;
    updated_at?: string;
  };

  return {
    reportId: data.reportId ?? snake.report_id ?? 0,
    userId: data.userId ?? snake.user_id ?? 0,
    expertId: data.expertId ?? snake.expert_id ?? 0,
    chatRoomId: data.chatRoomId ?? snake.chat_room_id ?? 0,
    chatFeedbackId: data.chatFeedbackId ?? snake.chat_feedback_id ?? 0,
    chatRequestId: data.chatRequestId ?? snake.chat_request_id ?? 0,
    resumeId: data.resumeId ?? snake.resume_id ?? 0,
    title: data.title ?? '',
    status: data.status ?? '',
    resultJson: data.resultJson ?? snake.result_json ?? null,
    jobPostUrl: data.jobPostUrl ?? snake.job_post_url ?? '',
    createdAt: data.createdAt ?? snake.created_at ?? '',
    updatedAt: data.updatedAt ?? snake.updated_at ?? '',
  };
}
