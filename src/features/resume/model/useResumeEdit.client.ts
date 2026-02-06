import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getMe } from '@/features/auth';
import { createPresignedUrl, uploadToPresignedUrl } from '@/features/uploads';
import {
  createResume,
  getResumeDetail,
  parseResumeSync,
  updateResume,
  type ResumeParseContentJson,
  type ResumeParseSyncResult,
} from '@/entities/resumes';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { useCommonApiErrorHandler } from '@/shared/api';

export type CareerItem = {
  id: string;
  company: string;
  period: string;
  role: string;
  title: string;
};

export type ProjectItem = {
  id: string;
  title: string;
  period: string;
  description: string;
};

type ContentProjectItem = {
  title?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

type ContentCareerItem = {
  company?: string;
  company_name?: string;
  job?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
};

export type SimpleItem = {
  id: string;
  value: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const MAX_RESUME_PDF_SIZE = 5 * 1024 * 1024;

const mapEducationLevel = (
  educationLevel: string,
  fallbackList: string[],
  allowedLevels: string[],
): string | null => {
  const normalized = educationLevel.trim();
  if (allowedLevels.includes(normalized)) return normalized;

  const listMatch = fallbackList.find((item) => allowedLevels.includes(item));
  if (listMatch) return listMatch;

  if (/고등학교/.test(normalized)) return '고등학교 졸업';
  if (/2년제/.test(normalized) && /재학|휴학/.test(normalized)) return '2년제 재학/휴학';
  if (/2년제/.test(normalized)) return '2년제 졸업';
  if (/4년제/.test(normalized) && /재학|휴학/.test(normalized)) return '4년제 재학/휴학';
  if (/4년제/.test(normalized)) return '4년제 졸업';

  return null;
};

export function useResumeEdit(resumeIdParam: string | null) {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/resume' });

  const resumeId = resumeIdParam ? Number(resumeIdParam) : null;
  const isEditMode = Boolean(resumeId && Number.isFinite(resumeId));

  const [title, setTitle] = useState('');
  const [isFresher, setIsFresher] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [careers, setCareers] = useState<CareerItem[]>([
    { id: createId(), company: '', period: '', role: '', title: '' },
  ]);
  const [projects, setProjects] = useState<ProjectItem[]>([
    { id: createId(), title: '', period: '', description: '' },
  ]);
  const [education, setEducation] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);
  const [awards, setAwards] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);
  const [certificates, setCertificates] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);
  const [activities, setActivities] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);
  const [isLoadingResume, setIsLoadingResume] = useState(false);

  const educationOptions = useMemo(
    () => ['고등학교 졸업', '2년제 재학/휴학', '2년제 졸업', '4년제 재학/휴학', '4년제 졸업'],
    [],
  );

  const payload = useMemo(
    () => ({
      title,
      is_fresher: isFresher,
      education_level: education[0]?.value ?? '',
      file_url: fileUrl,
      content_json: {
        careers: careers
          .map((career) =>
            [career.company, career.period, career.role, career.title].filter(Boolean).join(' | '),
          )
          .filter(Boolean),
        projects: projects.map((project) => {
          const [startDate, endDate] = project.period.split('-').map((item) => item.trim());
          return {
            title: project.title,
            start_date: startDate || '',
            end_date: endDate || '',
            description: project.description,
          };
        }),
        education: education.map((item) => item.value).filter(Boolean),
        awards: awards.map((item) => item.value).filter(Boolean),
        certificates: certificates.map((item) => item.value).filter(Boolean),
        activities: activities.map((item) => item.value).filter(Boolean),
      },
    }),
    [title, isFresher, fileUrl, careers, projects, education, awards, certificates, activities],
  );

  const formatDateToken = useCallback((value: string) => {
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) {
      return value.replace(/-/g, '.');
    }
    return value;
  }, []);

  const buildPeriodFromDates = useCallback(
    (start?: string, end?: string, isCurrent?: boolean) => {
      const startValue = start ? formatDateToken(start) : '';
      const endValue = end ? formatDateToken(end) : isCurrent ? 'Present' : '';
      return [startValue, endValue].filter(Boolean).join(' - ');
    },
    [formatDateToken],
  );

  const normalizeCareerItems = useCallback(
    (value: unknown): CareerItem[] => {
      if (!Array.isArray(value)) {
        return [{ id: createId(), company: '', period: '', role: '', title: '' }];
      }

      const parsed = value
        .map((item) => {
          if (typeof item === 'string') {
            const [company = '', period = '', role = '', titleValue = ''] = item
              .split('|')
              .map((entry) => entry.trim());
            return { id: createId(), company, period, role, title: titleValue };
          }
          if (item && typeof item === 'object') {
            const career = item as ContentCareerItem;
            const company = career.company ?? career.company_name ?? '';
            const role = career.job ?? '';
            const titleValue = career.position ?? '';
            const period = buildPeriodFromDates(
              career.start_date,
              career.end_date,
              career.is_current,
            );
            return { id: createId(), company, period, role, title: titleValue };
          }
          return null;
        })
        .filter((item): item is CareerItem => Boolean(item));

      return parsed.length
        ? parsed
        : [{ id: createId(), company: '', period: '', role: '', title: '' }];
    },
    [buildPeriodFromDates],
  );

  useEffect(() => {
    if (!isEditMode || authStatus !== 'authed' || !resumeId) return;

    let cancelled = false;
    setIsLoadingResume(true);

    (async () => {
      try {
        const data = await getResumeDetail(resumeId);
        if (cancelled) return;

        setTitle(data.title ?? '');
        setIsFresher(Boolean(data.isFresher));
        setFileUrl(data.fileUrl ?? '');

        const content = data.contentJson ?? {};
        const careersValue = (content as { careers?: unknown }).careers;
        const projectsValue = Array.isArray(
          (content as { projects?: ContentProjectItem[] }).projects,
        )
          ? ((content as { projects?: ContentProjectItem[] }).projects ?? []).map((project) => ({
              id: createId(),
              title: project.title ?? '',
              period: buildPeriodFromDates(project.start_date, project.end_date),
              description: project.description ?? '',
            }))
          : [];
        const educationValue = Array.isArray((content as { education?: string[] }).education)
          ? ((content as { education?: string[] }).education ?? [])
          : [];
        const awardsValue = Array.isArray((content as { awards?: string[] }).awards)
          ? ((content as { awards?: string[] }).awards ?? [])
          : [];
        const certificatesValue = Array.isArray(
          (content as { certificates?: string[] }).certificates,
        )
          ? ((content as { certificates?: string[] }).certificates ?? [])
          : [];
        const activitiesValue = Array.isArray((content as { activities?: string[] }).activities)
          ? ((content as { activities?: string[] }).activities ?? [])
          : [];

        setCareers(normalizeCareerItems(careersValue));
        setProjects(
          projectsValue.length
            ? projectsValue
            : [{ id: createId(), title: '', period: '', description: '' }],
        );
        const resolvedEducation =
          mapEducationLevel(data.educationLevel ?? '', educationValue, educationOptions) ??
          educationValue[0] ??
          '';
        setEducation([{ id: createId(), value: resolvedEducation }]);
        setAwards(
          awardsValue.length
            ? awardsValue.map((item) => ({ id: createId(), value: item }))
            : [{ id: createId(), value: '' }],
        );
        setCertificates(
          certificatesValue.length
            ? certificatesValue.map((item) => ({ id: createId(), value: item }))
            : [{ id: createId(), value: '' }],
        );
        setActivities(
          activitiesValue.length
            ? activitiesValue.map((item) => ({ id: createId(), value: item }))
            : [{ id: createId(), value: '' }],
        );
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingResume(false);
          return;
        }
        setSubmitError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoadingResume(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authStatus,
    buildPeriodFromDates,
    educationOptions,
    handleCommonApiError,
    isEditMode,
    normalizeCareerItems,
    resumeId,
  ]);

  const toSimpleItems = (values: string[]): SimpleItem[] => {
    if (!values.length) return [{ id: createId(), value: '' }];
    return values.map((value) => ({ id: createId(), value }));
  };

  const normalizeYearMonth = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const normalized = trimmed.replace(/[./]/g, '-');
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(normalized)) {
      return normalized.slice(0, 7);
    }
    return trimmed;
  };

  const splitPeriod = (period: string) => {
    const raw = period.replace(/[~–—]/g, '-');
    const [startRaw = '', endRaw = ''] = raw.split('-').map((item) => item.trim());
    const start = normalizeYearMonth(startRaw);
    const end = normalizeYearMonth(endRaw);
    return { start, end };
  };

  const applyParsedResult = (result: ResumeParseSyncResult | null) => {
    if (!result) {
      setAutoFillError('이력서 자동 등록에 실패했습니다.');
      return;
    }

    const contentJson = (result.content_json ?? {}) as ResumeParseContentJson;
    const careersValue = Array.isArray(contentJson.careers) ? contentJson.careers : [];
    const projectsValue = Array.isArray(contentJson.projects) ? contentJson.projects : [];
    const educationValue = Array.isArray(contentJson.education) ? contentJson.education : [];
    const awardsValue = Array.isArray(contentJson.awards) ? contentJson.awards : [];
    const certificatesValue = Array.isArray(contentJson.certificates)
      ? contentJson.certificates
      : [];
    const activitiesValue = Array.isArray(contentJson.activities) ? contentJson.activities : [];

    if (typeof result.is_fresher === 'boolean') {
      setIsFresher(result.is_fresher);
    }

    const mappedEducation =
      result.education_level || educationValue.length
        ? mapEducationLevel(result.education_level ?? '', educationValue, educationOptions)
        : null;
    if (mappedEducation) {
      setEducation([{ id: education[0]?.id ?? createId(), value: mappedEducation }]);
    }

    setCareers(normalizeCareerItems(careersValue));

    setProjects(
      projectsValue.length
        ? projectsValue.map((project) => {
            const period = buildPeriodFromDates(project.start_date, project.end_date);
            return {
              id: createId(),
              title: project.title ?? '',
              period,
              description: project.description ?? '',
            };
          })
        : [{ id: createId(), title: '', period: '', description: '' }],
    );

    setAwards(toSimpleItems(awardsValue.filter(Boolean)));
    setCertificates(toSimpleItems(certificatesValue.filter(Boolean)));
    setActivities(toSimpleItems(activitiesValue.filter(Boolean)));
  };

  const handleAutoUpload = (file: File | null) => {
    if (!file || authStatus !== 'authed') return;
    if (file.type !== 'application/pdf') {
      setAutoFillError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_RESUME_PDF_SIZE) {
      setAutoFillError('이력서는 5MB 이하만 업로드할 수 있습니다.');
      return;
    }

    setAutoFillError(null);
    setIsAutoFilling(true);

    (async () => {
      try {
        const { presignedUrl, fileUrl: uploadedUrl } = await createPresignedUrl({
          target_type: 'RESUME_PDF',
          file_name: file.name,
          file_size: file.size,
        });
        await uploadToPresignedUrl(file, presignedUrl);
        const data = await parseResumeSync({ file_url: uploadedUrl, mode: 'sync' });
        applyParsedResult(data.result);
      } catch (error) {
        if (await handleCommonApiError(error)) {
          setIsAutoFilling(false);
          return;
        }
        setAutoFillError(
          error instanceof Error ? error.message : '이력서 자동 등록에 실패했습니다.',
        );
      } finally {
        setIsAutoFilling(false);
      }
    })();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
        setSubmitError(
          error instanceof Error
            ? error.message
            : isEditMode
              ? '이력서 수정에 실패했습니다.'
              : '이력서 생성에 실패했습니다.',
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return {
    authStatus,
    resumeId,
    isEditMode,
    title,
    setTitle,
    isFresher,
    setIsFresher,
    fileUrl,
    setFileUrl,
    submitError,
    autoFillError,
    isSubmitting,
    isAutoFilling,
    careers,
    setCareers,
    projects,
    setProjects,
    education,
    setEducation,
    awards,
    setAwards,
    certificates,
    setCertificates,
    activities,
    setActivities,
    isLoadingResume,
    educationOptions,
    handleAutoUpload,
    handleSubmit,
  };
}
