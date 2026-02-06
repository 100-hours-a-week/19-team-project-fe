'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createResume, updateResume } from '@/entities/resumes';
import { useCommonApiErrorHandler } from '@/shared/api';
import type { CareerItem, ProjectItem, SimpleItem } from './useResumeEditForm.client';

type UseResumeSubmitParams = {
  authStatus: 'checking' | 'authed' | 'guest';
  isEditMode: boolean;
  resumeId: number | null;
  title: string;
  isFresher: boolean;
  education: SimpleItem[];
  fileUrl: string;
  careers: CareerItem[];
  projects: ProjectItem[];
  payload: {
    content_json: Record<string, unknown>;
  };
  splitPeriod: (period: string) => { start: string; end: string };
  onError?: (message: string) => void;
};

export function useResumeSubmit({
  authStatus,
  isEditMode,
  resumeId,
  title,
  isFresher,
  education,
  fileUrl,
  careers,
  projects,
  payload,
  splitPeriod,
  onError,
}: UseResumeSubmitParams) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/resume' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authStatus !== 'authed') return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSubmitError('이력서 제목을 입력해 주세요.');
      return;
    }
    const educationLevel = education[0]?.value?.trim() ?? '';
    if (!educationLevel) {
      setSubmitError('학력 정보를 입력해 주세요.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    (async () => {
      try {
        if (isEditMode && resumeId) {
          const careersPayload = careers
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

          const projectsPayload = projects
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
            is_fresher: isFresher,
            education_level: education[0]?.value ?? '',
            content_json: {
              careers: careersPayload,
              projects: projectsPayload,
            },
          };
          await updateResume(resumeId, updatePayload);
        } else {
          const createPayload = {
            title: trimmedTitle,
            is_fresher: isFresher,
            education_level: educationLevel,
            file_url: fileUrl?.trim() ? fileUrl.trim() : null,
            content_json: payload.content_json,
          };
          await createResume(createPayload);
        }
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
