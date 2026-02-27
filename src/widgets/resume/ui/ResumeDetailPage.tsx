'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton } from '@/features/auth';
import { useResumeDetail } from '@/features/resume';
import { normalizeResumeContent } from '@/entities/resumes';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { formatKstString } from '@/shared/lib/date';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

const EMPTY_CONTENT_LABEL = '내용이 없습니다.';

const readString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const toDisplayText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const item = value as Record<string, unknown>;
    const company = readString(item.company) || readString(item.company_name);
    const role = readString(item.job);
    const position = readString(item.position);
    const startDate = readString(item.start_date);
    const endDate = readString(item.end_date);
    const period = [startDate, endDate].filter(Boolean).join(' - ');
    const careerText = [company, period, role, position].filter(Boolean).join(' | ');
    if (careerText) return careerText;
    const title = readString(item.title);
    const description = readString(item.description);
    const fallback = [title, description].filter(Boolean).join(' - ');
    return fallback || null;
  }
  return null;
};
const toTextArray = (value?: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<string[]>((acc, item) => {
    const text = toDisplayText(item);
    if (text) acc.push(text);
    return acc;
  }, []);
};
const toSafeSummary = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const toProjects = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.reduce<
    Array<{ title?: string; start_date?: string; end_date?: string; description?: string }>
  >((acc, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return acc;
    const project = item as Record<string, unknown>;
    const title = typeof project.title === 'string' ? project.title.trim() : '';
    const startDate = typeof project.start_date === 'string' ? project.start_date.trim() : '';
    const endDate = typeof project.end_date === 'string' ? project.end_date.trim() : '';
    const description = typeof project.description === 'string' ? project.description.trim() : '';
    acc.push({
      title: title || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      description: description || undefined,
    });
    return acc;
  }, []);
};

export default function ResumeDetailPage({ resumeId }: { resumeId: number }) {
  const router = useRouter();
  const { authStatus, resume, isLoading, loadError } = useResumeDetail(resumeId);

  const handleAuthSheetClose = () => {
    router.replace('/resume');
  };

  const content = useMemo(() => normalizeResumeContent(resume?.contentJson ?? null), [resume]);
  const careers = toTextArray(content?.careers);
  const projects = toProjects(content?.projects);
  const education = toTextArray(content?.education);
  const awards = toTextArray(content?.awards);
  const certificates = toTextArray(content?.certificates);
  const activities = toTextArray(content?.activities);
  const summary = toSafeSummary(content?.summary);
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
                  ? (formatKstString(resume.createdAt, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    }) ?? resume.createdAt)
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
