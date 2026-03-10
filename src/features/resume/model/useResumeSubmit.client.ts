'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { createResume, resumesQueryKey, updateResume } from '@/entities/resumes';
import { useCommonApiErrorHandler } from '@/shared/api';
import { buildResumeContentJson, splitPeriod, useResumeEditStore } from './resumeEditStore.client';

type UseResumeSubmitParams = {
  authStatus: 'checking' | 'authed' | 'guest';
  isEditMode: boolean;
  resumeId: number | null;
  onError?: (message: string) => void;
};

export function useResumeSubmit({
  authStatus,
  isEditMode,
  resumeId,
  onError,
}: UseResumeSubmitParams) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/resume' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authStatus !== 'authed') return;

    const snapshot = useResumeEditStore.getState();
    const trimmedTitle = snapshot.title.trim();
    if (!trimmedTitle) {
      setSubmitError('이력서 제목을 입력해 주세요.');
      return;
    }
    const educationLevel = snapshot.education[0]?.value?.trim() ?? '';
    if (!educationLevel) {
      setSubmitError('학력 정보를 입력해 주세요.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    (async () => {
      try {
        const contentJson = buildResumeContentJson(snapshot);

        if (isEditMode && resumeId) {
          const careersPayload = snapshot.isFresher
            ? []
            : snapshot.careers
                .map((career) => {
                  const { start, end } = splitPeriod(career.period);
                  return {
                    company_name: career.company.trim(),
                    job: career.role.trim(),
                    position: career.title.trim(),
                    start_date: start,
                    end_date: end,
                    is_current: Boolean(start) && !end,
                  };
                })
                .filter((career) =>
                  [
                    career.company_name,
                    career.job,
                    career.position,
                    career.start_date,
                    career.end_date,
                  ].some(Boolean),
                );

          const projectsPayload = snapshot.projects
            .map((project) => {
              const { start, end } = splitPeriod(project.period);
              return {
                title: project.title.trim(),
                start_date: start,
                end_date: end,
                description: project.description.trim(),
              };
            })
            .filter((project) =>
              [project.title, project.start_date, project.end_date, project.description].some(
                Boolean,
              ),
            );

          const updatePayload = {
            title: trimmedTitle,
            is_fresher: snapshot.isFresher,
            education_level: snapshot.education[0]?.value ?? '',
            content_json: {
              ...contentJson,
              careers: careersPayload,
              projects: projectsPayload,
            },
          };
          await updateResume(resumeId, updatePayload);
        } else {
          const createPayload = {
            title: trimmedTitle,
            is_fresher: snapshot.isFresher,
            education_level: educationLevel,
            file_url: snapshot.fileUrl?.trim() ? snapshot.fileUrl.trim() : null,
            content_json: contentJson,
          };
          await createResume(createPayload);
        }

        await queryClient.invalidateQueries({ queryKey: resumesQueryKey });
        router.replace('/resume');
      } catch (error) {
        if (await handleCommonApiError(error)) {
          setIsSubmitting(false);
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : isEditMode
              ? '이력서 수정에 실패했습니다.'
              : '이력서 생성에 실패했습니다.';
        setSubmitError(message);
        onError?.(message);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return { submitError, setSubmitError, isSubmitting, handleSubmit };
}
