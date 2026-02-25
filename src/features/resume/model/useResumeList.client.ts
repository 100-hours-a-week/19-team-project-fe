import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  createResume,
  deleteResume,
  getResumeParseTask,
  resumesQueryKey,
  useResumesQuery,
  type Resume,
  type ResumeParseTaskResult,
} from '@/entities/resumes';
import { useAuthStatus } from '@/entities/auth';
import { useCommonApiErrorHandler } from '@/shared/api';
import {
  APP_NOTIFICATION_EVENT,
  type AppNotificationEventDetail,
} from '@/shared/lib/realtimeNotification.client';
import {
  readPendingResumeParseTasks,
  writePendingResumeParseTasks,
  type PendingResumeParseTask,
} from '../lib/resumeParsePending.client';

const DEFAULT_EDUCATION_LEVEL = '4년제 졸업';
const DEFAULT_AUTO_TITLE = '자동 생성 이력서';

export function useResumeList() {
  const { status: authStatus } = useAuthStatus();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingResumeParseTask[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const pendingTasksRef = useRef<PendingResumeParseTask[]>([]);
  const handlingTaskIdsRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { data, error, isLoading, refetch } = useResumesQuery({ enabled: authStatus === 'authed' });

  useEffect(() => {
    if (authStatus !== 'authed') {
      setLoadError(null);
      setResumes([]);
      setPendingTasks([]);
      return;
    }
    setResumes(data?.resumes ?? []);
  }, [authStatus, data]);

  useEffect(() => {
    if (authStatus !== 'authed') {
      pendingTasksRef.current = [];
      return;
    }
    const stored = readPendingResumeParseTasks();
    setPendingTasks(stored);
    pendingTasksRef.current = stored;
  }, [authStatus]);

  useEffect(() => {
    if (!error) {
      setLoadError(null);
      return;
    }
    (async () => {
      if (await handleCommonApiError(error)) return;
      setLoadError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
    })();
  }, [error, handleCommonApiError]);

  useEffect(() => {
    setIsLoadingResumes(authStatus === 'authed' ? isLoading : false);
  }, [authStatus, isLoading]);

  useEffect(() => {
    if (!openMenuId) return;
    if (resumes.some((item) => item.resumeId === openMenuId)) return;
    setOpenMenuId(null);
  }, [openMenuId, resumes]);

  const updatePendingTasks = useCallback(
    (updater: (prev: PendingResumeParseTask[]) => PendingResumeParseTask[]) => {
      setPendingTasks((prev) => {
        const next = updater(prev);
        pendingTasksRef.current = next;
        writePendingResumeParseTasks(next);
        return next;
      });
    },
    [],
  );

  const removePendingTask = useCallback(
    (taskId: string) => {
      updatePendingTasks((prev) => prev.filter((task) => task.taskId !== taskId));
    },
    [updatePendingTasks],
  );

  const createResumeFromParseResult = useCallback(
    async (taskId: string, result: ResumeParseTaskResult | null | undefined) => {
      if (handlingTaskIdsRef.current.has(taskId)) return;
      handlingTaskIdsRef.current.add(taskId);

      const task = pendingTasksRef.current.find((item) => item.taskId === taskId);
      if (!task) {
        handlingTaskIdsRef.current.delete(taskId);
        return;
      }

      try {
        const rawEducation = result?.education_level ?? result?.educationLevel;
        const educationLevel =
          typeof rawEducation === 'string' && rawEducation.trim()
            ? rawEducation.trim()
            : DEFAULT_EDUCATION_LEVEL;
        const rawContent = result?.content_json ?? result?.contentJson;
        const contentJson =
          rawContent && typeof rawContent === 'object' && !Array.isArray(rawContent)
            ? (rawContent as Record<string, unknown>)
            : {};
        const rawIsFresher = result?.is_fresher ?? result?.isFresher;

        await createResume({
          title: DEFAULT_AUTO_TITLE,
          is_fresher: typeof rawIsFresher === 'boolean' ? rawIsFresher : false,
          education_level: educationLevel,
          file_url: task.fileUrl || null,
          content_json: contentJson,
        });
        await queryClient.invalidateQueries({ queryKey: resumesQueryKey });
      } catch (error) {
        await handleCommonApiError(error);
      } finally {
        removePendingTask(taskId);
        handlingTaskIdsRef.current.delete(taskId);
      }
    },
    [handleCommonApiError, queryClient, removePendingTask],
  );

  const syncPendingTasks = useCallback(async () => {
    if (authStatus !== 'authed') return;
    const tasks = pendingTasksRef.current;
    if (!tasks.length) return;

    await Promise.all(
      tasks.map(async (task) => {
        try {
          const taskData = await getResumeParseTask(task.taskId);
          if (taskData.status === 'FAILED') {
            removePendingTask(task.taskId);
            return;
          }
          if (taskData.status === 'COMPLETED') {
            await createResumeFromParseResult(task.taskId, taskData.result);
          }
        } catch (error) {
          await handleCommonApiError(error);
        }
      }),
    );
  }, [authStatus, createResumeFromParseResult, handleCommonApiError, removePendingTask]);

  const refreshResumes = useCallback(() => {
    if (authStatus !== 'authed') return;
    void refetch();
  }, [authStatus, refetch]);

  useEffect(() => {
    if (authStatus !== 'authed') return;
    refreshResumes();
    void syncPendingTasks();

    const handleFocusRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      refreshResumes();
      void syncPendingTasks();
    };

    const handleRealtimeNotification = (event: Event) => {
      const detail = (event as CustomEvent<AppNotificationEventDetail>).detail;
      if (!detail?.notificationType) return;
      if (
        detail.notificationType === 'RESUME_PARSE_COMPLETED' ||
        detail.notificationType === 'RESUME_PARSE_FAILED'
      ) {
        void syncPendingTasks();
      }
    };

    window.addEventListener('focus', handleFocusRefresh);
    document.addEventListener('visibilitychange', handleFocusRefresh);
    window.addEventListener(APP_NOTIFICATION_EVENT, handleRealtimeNotification as EventListener);

    return () => {
      window.removeEventListener('focus', handleFocusRefresh);
      document.removeEventListener('visibilitychange', handleFocusRefresh);
      window.removeEventListener(
        APP_NOTIFICATION_EVENT,
        handleRealtimeNotification as EventListener,
      );
    };
  }, [authStatus, refreshResumes, syncPendingTasks]);

  const handleDeleteResume = async (resumeId: number) => {
    if (isDeletingId) return;
    const confirmed = window.confirm('이력서를 삭제할까요?');
    if (!confirmed) return;
    setIsDeletingId(resumeId);

    try {
      await deleteResume(resumeId);
      queryClient.setQueryData<{ resumes: Resume[] } | undefined>(resumesQueryKey, (prev) => {
        if (!prev) return { resumes: [] };
        return { ...prev, resumes: prev.resumes.filter((item) => item.resumeId !== resumeId) };
      });
    } catch (error) {
      await handleCommonApiError(error);
    } finally {
      setIsDeletingId(null);
    }
  };

  return {
    authStatus,
    resumes,
    pendingTasks,
    isLoadingResumes,
    loadError,
    openMenuId,
    setOpenMenuId,
    isDeletingId,
    handleDeleteResume,
  };
}
