export const RESUME_TASK_REFRESH_EVENT = 'resume-task-refresh';

export type ResumeTaskRefreshPayload = {
  taskId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: unknown;
};

type ResumeEventLike = {
  type?: unknown;
  taskId?: unknown;
  task_id?: unknown;
  status?: unknown;
  result?: unknown;
  data?: unknown;
};

function normalizeStatus(value: unknown): ResumeTaskRefreshPayload['status'] | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toUpperCase();
  if (normalized === 'PROCESSING' || normalized === 'COMPLETED' || normalized === 'FAILED') {
    return normalized;
  }
  return null;
}

export function parseResumeTaskRealtimePayload(raw: unknown): ResumeTaskRefreshPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const event = raw as ResumeEventLike;

  const target =
    event.data && typeof event.data === 'object'
      ? ({ ...event.data, type: event.type } as ResumeEventLike)
      : event;
  const taskIdValue = target.taskId ?? target.task_id;
  if (typeof taskIdValue !== 'string' || !taskIdValue.trim()) return null;

  const status = normalizeStatus(target.status);
  if (!status) return null;

  return {
    taskId: taskIdValue.trim(),
    status,
    result: target.result,
  };
}
