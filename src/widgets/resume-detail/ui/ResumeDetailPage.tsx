'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { getResumeDetail, type ResumeDetail } from '@/entities/resumes';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { useCommonApiErrorHandler } from '@/shared/api';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

const EMPTY_CONTENT_LABEL = '내용이 없습니다.';

type ResumeContent = {
  summary?: string;
  careers?: string[];
  projects?: Array<{
    title?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  education?: string[];
  awards?: string[];
  certificates?: string[];
  activities?: string[];
};

const normalizeContent = (value: ResumeDetail['contentJson']): ResumeContent | null => {
  if (!value || typeof value !== 'object') return null;
  return value as ResumeContent;
};

const toArray = (value?: string[]) => (Array.isArray(value) ? value.filter(Boolean) : []);

export default function ResumeDetailPage({ resumeId }: { resumeId: number }) {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/resume' });
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setResume(null);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const data = await getResumeDetail(resumeId);
        if (cancelled) return;
        setResume(data);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoading(false);
          return;
        }
        setLoadError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError, resumeId]);

  const handleAuthSheetClose = () => {
    router.replace('/resume');
  };

  const content = normalizeContent(resume?.contentJson ?? null);
  const careers = toArray(content?.careers);
  const projects = Array.isArray(content?.projects) ? (content?.projects ?? []) : [];
  const education = toArray(content?.education);
  const awards = toArray(content?.awards);
  const certificates = toArray(content?.certificates);
  const activities = toArray(content?.activities);
  const summary = content?.summary?.trim();
  const hasContent =
    Boolean(summary) ||
    careers.length > 0 ||
    projects.length > 0 ||
    education.length > 0 ||
    awards.length > 0 ||
    certificates.length > 0 ||
    activities.length > 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-2.5 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <div className="flex items-center gap-3">
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
          <h1 className="text-2xl font-semibold text-black">이력서 상세</h1>
        </div>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : isLoading ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">이력서를 불러오는 중...</p>
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-red-500">{loadError}</p>
          </div>
        ) : resume ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-lg font-semibold text-text-title">{resume.title}</p>
              <p className="mt-2 text-xs text-text-caption">
                {resume.isFresher ? '신입' : '경력'} · {resume.educationLevel || '학력 정보 없음'}
              </p>
              <p className="mt-2 text-xs text-text-caption">
                {resume.createdAt
                  ? new Date(resume.createdAt).toLocaleDateString('ko-KR')
                  : '등록일 정보 없음'}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold text-text-title">상세 내용</p>
              {!hasContent ? (
                <p className="mt-3 text-sm text-text-body">{EMPTY_CONTENT_LABEL}</p>
              ) : (
                <div className="mt-4 flex flex-col gap-4 text-sm text-text-body">
                  {summary ? (
                    <div>
                      <p className="text-xs font-semibold text-text-caption">요약</p>
                      <p className="mt-2 whitespace-pre-wrap">{summary}</p>
                    </div>
                  ) : null}

                  {careers.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-text-caption">주요 경력</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {careers.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {projects.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-text-caption">주요 프로젝트</p>
                      <div className="mt-2 space-y-3">
                        {projects.map((project, index) => {
                          const period = [project.start_date, project.end_date]
                            .filter(Boolean)
                            .join(' - ');
                          return (
                            <div
                              key={`${project.title ?? 'project'}-${index}`}
                              className="rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-3"
                            >
                              <p className="font-semibold text-text-title">
                                {project.title || '프로젝트'}
                              </p>
                              {period ? (
                                <p className="mt-1 text-xs text-text-caption">{period}</p>
                              ) : null}
                              {project.description ? (
                                <p className="mt-2 whitespace-pre-wrap">{project.description}</p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {education.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-text-caption">학력</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {education.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {awards.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-text-caption">수상 내역</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {awards.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {certificates.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-text-caption">자격증</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {certificates.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {activities.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-text-caption">대외 활동 / 기타</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {activities.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {resume.fileUrl ? (
              <a
                href={resume.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-gray-100 bg-white px-5 py-4 text-center text-sm font-semibold text-primary-main shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
              >
                첨부 파일 보기
              </a>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">이력서를 찾을 수 없습니다.</p>
          </div>
        )}
      </section>

      <Footer />

      <AuthGateSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        description="이력서를 보려면 로그인해 주세요."
        onClose={handleAuthSheetClose}
      >
        <KakaoLoginButton />
      </AuthGateSheet>
    </div>
  );
}
