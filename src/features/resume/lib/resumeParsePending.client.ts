'use client';

export type PendingResumeParseTask = {
  taskId: string;
  fileUrl: string;
  createdAt: string;
};

const STORAGE_KEY = 'resumeParsePendingTasks';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

export function readPendingResumeParseTasks(): PendingResumeParseTask[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingResumeParseTask[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.taskId === 'string' &&
        item.taskId.length > 0 &&
        typeof item.fileUrl === 'string' &&
        typeof item.createdAt === 'string',
    );
  } catch {
    return [];
  }
}

export function writePendingResumeParseTasks(tasks: PendingResumeParseTask[]) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addPendingResumeParseTask(task: PendingResumeParseTask) {
  const current = readPendingResumeParseTasks();
  const withoutSame = current.filter((item) => item.taskId !== task.taskId);
  writePendingResumeParseTasks([task, ...withoutSame]);
}
