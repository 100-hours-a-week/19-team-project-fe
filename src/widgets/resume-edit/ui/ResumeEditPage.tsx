'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
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
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { useCommonApiErrorHandler } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

type CareerItem = {
  id: string;
  company: string;
  period: string;
  role: string;
  title: string;
};

type ProjectItem = {
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

type SimpleItem = {
  id: string;
  value: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const inlineFieldClass =
  'w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20 disabled:bg-gray-100 disabled:text-gray-400';

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
  if (/4년제/.test(normalized) && /재학|휴학/.test(normalized)) return '4년제 졸업/휴학';
  if (/4년제/.test(normalized)) return '4년제 졸업';

  return null;
};

export default function ResumeEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/resume' });

  const resumeIdParam = searchParams.get('resumeId');
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
    () => ['고등학교 졸업', '2년제 재학/휴학', '2년제 졸업', '4년제 졸업/휴학', '4년제 졸업'],
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
        const careersValue = Array.isArray((content as { careers?: string[] }).careers)
          ? ((content as { careers?: string[] }).careers ?? [])
          : [];
        const projectsValue = Array.isArray(
          (content as { projects?: ContentProjectItem[] }).projects,
        )
          ? ((content as { projects?: ContentProjectItem[] }).projects ?? []).map((project) => ({
              id: createId(),
              title: project.title ?? '',
              period: [project.start_date, project.end_date].filter(Boolean).join(' - '),
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

        setCareers(
          careersValue.length
            ? careersValue.map((item) => {
                const [company = '', period = '', role = '', titleValue = ''] = item
                  .split('|')
                  .map((entry) => entry.trim());
                return { id: createId(), company, period, role, title: titleValue };
              })
            : [{ id: createId(), company: '', period: '', role: '', title: '' }],
        );
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
  }, [authStatus, handleCommonApiError, isEditMode, resumeId]);
  const handleAuthSheetClose = () => {
    router.replace('/resume');
  };

  const toSimpleItems = (values: string[]): SimpleItem[] => {
    if (!values.length) return [{ id: createId(), value: '' }];
    return values.map((value) => ({ id: createId(), value }));
  };

  const formatDateToken = (value: string) => {
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) {
      return value.replace(/-/g, '.');
    }
    return value;
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

    setCareers(
      careersValue.length
        ? careersValue.map((item) => {
            const [company = '', period = '', role = '', titleValue = ''] = item
              .split('|')
              .map((entry) => entry.trim());
            return { id: createId(), company, period, role, title: titleValue };
          })
        : [{ id: createId(), company: '', period: '', role: '', title: '' }],
    );

    setProjects(
      projectsValue.length
        ? projectsValue.map((project) => {
            const start = project.start_date ? formatDateToken(project.start_date) : '';
            const end = project.end_date ? formatDateToken(project.end_date) : '';
            const period = [start, end].filter(Boolean).join(' - ');
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

  const handleAutoFill = () => {
    if (authStatus !== 'authed') return;
    document.getElementById('resume-auto-upload')?.click();
  };

  const handleAutoUpload = (file: File | null) => {
    if (!file || authStatus !== 'authed') return;
    if (file.type !== 'application/pdf') {
      setAutoFillError('PDF 파일만 업로드할 수 있습니다.');
      return;
    }

    setAutoFillError(null);
    setIsAutoFilling(true);

    (async () => {
      try {
        const { presignedUrl, fileUrl: uploadedUrl } = await createPresignedUrl({
          target_type: 'PROFILE_IMAGE',
          file_name: file.name,
        });
        await uploadToPresignedUrl(file, presignedUrl);
        setFileUrl(uploadedUrl);
        window.open(uploadedUrl, '_blank', 'noopener,noreferrer');
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

          await updateResume(resumeId, {
            title: trimmedTitle,
            is_fresher: isFresher,
            education_level: education[0]?.value ?? '',
            content_json: {
              careers: careersPayload,
              projects: projectsPayload,
            },
          });
        } else {
          await createResume({
            title: trimmedTitle,
            is_fresher: isFresher,
            education_level: educationLevel,
            file_url: fileUrl?.trim() ? fileUrl.trim() : null,
            content_json: payload.content_json,
          });
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

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-6 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="resume-auto-upload"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = '';
              handleAutoUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => router.replace('/resume')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
            aria-label="뒤로 가기"
          >
            <svg
              data-slot="icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-black">
            {isEditMode ? '이력서 수정' : '이력서 생성'}
          </h1>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isAutoFilling || authStatus !== 'authed'}
            className={`ml-auto rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isAutoFilling || authStatus !== 'authed'
                ? 'border-gray-200 bg-gray-100 text-gray-400'
                : 'border-primary-main bg-primary-main/10 text-primary-main'
            }`}
          >
            {isAutoFilling ? '자동 등록 중...' : '자동 등록'}
          </button>
        </div>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : isEditMode && isLoadingResume ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">이력서를 불러오는 중...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-6">
            {autoFillError ? (
              <div className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm text-red-500 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                {autoFillError}
              </div>
            ) : null}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <Input.Root>
                <Input.Label>
                  이력서 제목 <span className="text-red-500">*</span>
                </Input.Label>
                <Input.Field
                  placeholder="텍스트를 입력해 주세요."
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Input.Root>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-black">구직자 정보</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <p className="text-sm font-semibold text-gray-700">
                  학력 <span className="text-red-500">*</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {educationOptions.map((level) => {
                    const selected = (education[0]?.value ?? '') === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          setEducation([{ id: education[0]?.id ?? createId(), value: level }])
                        }
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                          selected
                            ? 'border-primary-main bg-primary-main/10 text-primary-main'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm font-semibold text-gray-700">
                  신입/경력 <span className="text-red-500">*</span>
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFresher(true)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      isFresher
                        ? 'border-primary-main bg-primary-main/10 text-primary-main'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    신입
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFresher(false)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      !isFresher
                        ? 'border-primary-main bg-primary-main/10 text-primary-main'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    경력
                  </button>
                </div>

                {!isFresher ? (
                  <>
                    {careers.map((career, index) => (
                      <div key={career.id} className="mt-3 rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center gap-2">
                          <input
                            placeholder="회사명"
                            value={career.company}
                            onChange={(event) => {
                              const next = [...careers];
                              next[index] = { ...career, company: event.target.value };
                              setCareers(next);
                            }}
                            className={`${inlineFieldClass} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = careers.filter((item) => item.id !== career.id);
                              setCareers(
                                next.length
                                  ? next
                                  : [
                                      {
                                        id: createId(),
                                        company: '',
                                        period: '',
                                        role: '',
                                        title: '',
                                      },
                                    ],
                              );
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
                            aria-label="경력 삭제"
                          >
                            -
                          </button>
                        </div>
                        <input
                          placeholder="YYYY.MM - YYYY.MM (0년 0개월)"
                          value={career.period}
                          onChange={(event) => {
                            const next = [...careers];
                            next[index] = { ...career, period: event.target.value };
                            setCareers(next);
                          }}
                          className={`${inlineFieldClass} mt-2`}
                        />
                        <input
                          placeholder="직무"
                          value={career.role}
                          onChange={(event) => {
                            const next = [...careers];
                            next[index] = { ...career, role: event.target.value };
                            setCareers(next);
                          }}
                          className={`${inlineFieldClass} mt-2`}
                        />
                        <input
                          placeholder="직책"
                          value={career.title}
                          onChange={(event) => {
                            const next = [...careers];
                            next[index] = { ...career, title: event.target.value };
                            setCareers(next);
                          }}
                          className={`${inlineFieldClass} mt-2`}
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setCareers((prev) => [
                          ...prev,
                          { id: createId(), company: '', period: '', role: '', title: '' },
                        ])
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
                    >
                      + 주요 경력 추가
                    </button>
                  </>
                ) : null}

                <p className="mt-2 text-xs text-red-500" aria-hidden="true" />
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-black">주요 프로젝트</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className={`rounded-xl border border-gray-200 p-3 ${index > 0 ? 'mt-3' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        placeholder="프로젝트 이름"
                        value={project.title}
                        onChange={(event) => {
                          const next = [...projects];
                          next[index] = { ...project, title: event.target.value };
                          setProjects(next);
                        }}
                        className={`${inlineFieldClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = projects.filter((item) => item.id !== project.id);
                          setProjects(
                            next.length
                              ? next
                              : [{ id: createId(), title: '', period: '', description: '' }],
                          );
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
                        aria-label="프로젝트 삭제"
                      >
                        -
                      </button>
                    </div>
                    <input
                      placeholder="YYYY.MM - YYYY.MM (0년 0개월)"
                      value={project.period}
                      onChange={(event) => {
                        const next = [...projects];
                        next[index] = { ...project, period: event.target.value };
                        setProjects(next);
                      }}
                      className={`${inlineFieldClass} mt-2`}
                    />
                    <textarea
                      value={project.description}
                      onChange={(event) => {
                        const next = [...projects];
                        next[index] = { ...project, description: event.target.value };
                        setProjects(next);
                      }}
                      className="mt-2 w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
                      rows={3}
                      placeholder="프로젝트 설명"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setProjects((prev) => [
                      ...prev,
                      { id: createId(), title: '', period: '', description: '' },
                    ])
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
                >
                  + 주요 프로젝트 추가
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-black">수상 내역</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                {awards.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 ${index > 0 ? 'mt-3' : ''}`}
                  >
                    <input
                      placeholder="텍스트를 입력해 주세요."
                      value={item.value}
                      onChange={(event) => {
                        setAwards((prev) =>
                          prev.map((entry) =>
                            entry.id === item.id ? { ...entry, value: event.target.value } : entry,
                          ),
                        );
                      }}
                      className={`${inlineFieldClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = awards.filter((entry) => entry.id !== item.id);
                        setAwards(next.length ? next : [{ id: createId(), value: '' }]);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
                      aria-label="수상 삭제"
                    >
                      -
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setAwards((prev) => [...prev, { id: createId(), value: '' }])}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
                >
                  + 수상 내역 추가
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-black">자격증</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                {certificates.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 ${index > 0 ? 'mt-3' : ''}`}
                  >
                    <input
                      placeholder="텍스트를 입력해 주세요."
                      value={item.value}
                      onChange={(event) => {
                        setCertificates((prev) =>
                          prev.map((entry) =>
                            entry.id === item.id ? { ...entry, value: event.target.value } : entry,
                          ),
                        );
                      }}
                      className={`${inlineFieldClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = certificates.filter((entry) => entry.id !== item.id);
                        setCertificates(next.length ? next : [{ id: createId(), value: '' }]);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
                      aria-label="자격증 삭제"
                    >
                      -
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setCertificates((prev) => [...prev, { id: createId(), value: '' }])
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
                >
                  + 자격증 추가
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-black">대외 활동 / 기타</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                {activities.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 ${index > 0 ? 'mt-3' : ''}`}
                  >
                    <input
                      placeholder="텍스트를 입력해 주세요."
                      value={item.value}
                      onChange={(event) => {
                        setActivities((prev) =>
                          prev.map((entry) =>
                            entry.id === item.id ? { ...entry, value: event.target.value } : entry,
                          ),
                        );
                      }}
                      className={`${inlineFieldClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = activities.filter((entry) => entry.id !== item.id);
                        setActivities(next.length ? next : [{ id: createId(), value: '' }]);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
                      aria-label="활동 삭제"
                    >
                      -
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setActivities((prev) => [...prev, { id: createId(), value: '' }])}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
                >
                  + 활동 추가
                </button>
                <p className="mt-2 text-xs text-red-500" aria-hidden="true" />
              </div>
            </section>

            {submitError ? <p className="mb-0 text-sm text-red-500">{submitError}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? '이력서 수정 중...'
                  : '이력서 생성 중...'
                : isEditMode
                  ? '이력서 수정'
                  : '이력서 생성'}
            </Button>
          </form>
        )}
      </section>

      <Footer />

      <AuthGateSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        description="이력서를 업데이트하려면 로그인해 주세요."
        onClose={handleAuthSheetClose}
      >
        <KakaoLoginButton />
      </AuthGateSheet>
    </div>
  );
}
