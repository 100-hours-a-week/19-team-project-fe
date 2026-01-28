'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
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

type SimpleItem = {
  id: string;
  value: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const inlineFieldClass =
  'w-full rounded-md border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20 disabled:bg-gray-100 disabled:text-gray-400';

export default function ResumeEditPage() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);

  const [title, setTitle] = useState('이력서 테스트1');
  const [isFresher, setIsFresher] = useState(true);
  const [fileUrl, setFileUrl] = useState(
    'https://refit-storage-dev.s3.ap-northeast-2.amazonaws.com/task/resume/....pdf',
  );

  const [careers, setCareers] = useState<CareerItem[]>([
    { id: createId(), company: '', period: '', role: '', title: '' },
  ]);
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: createId(),
      title: "AI 커리어 의사결정 서비스 'Re-fit'",
      period: '2025.12 - Present',
      description: '...',
    },
  ]);
  const [education, setEducation] = useState<SimpleItem[]>([
    { id: createId(), value: 'AI 실무 개발 부트캠프 졸업' },
  ]);
  const [awards, setAwards] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);
  const [certificates, setCertificates] = useState<SimpleItem[]>([
    { id: createId(), value: '정보처리기사' },
    { id: createId(), value: 'AICE (Associate)' },
  ]);
  const [activities, setActivities] = useState<SimpleItem[]>([{ id: createId(), value: '' }]);

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

  const handleAuthSheetClose = () => {
    router.replace('/resume');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-6 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
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
          <h1 className="text-2xl font-semibold text-black">이력서 업데이트</h1>
        </div>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-6">
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
              <h2 className="text-lg font-semibold text-black">지원자 정보</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    주요 경력 <span className="text-red-500">*</span>
                  </p>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <span>신입</span>
                    <input
                      type="checkbox"
                      checked={isFresher}
                      onChange={(event) => setIsFresher(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-main focus:ring-primary-main/20"
                    />
                  </label>
                </div>

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
                              : [{ id: createId(), company: '', period: '', role: '', title: '' }],
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

                <p className="mt-2 text-xs text-red-500">*helper text 1</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-black">주요 프로젝트</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                {projects.map((project, index) => (
                  <div key={project.id} className="rounded-xl border border-gray-200 p-3">
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
              <h2 className="text-lg font-semibold text-black">
                학력 <span className="text-red-500">*</span>
              </h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                {education.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      placeholder="필수 선택"
                      value={item.value}
                      onChange={(event) => {
                        setEducation((prev) =>
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
                        const next = education.filter((entry) => entry.id !== item.id);
                        setEducation(next.length ? next : [{ id: createId(), value: '' }]);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-xl text-gray-500"
                      aria-label="학력 삭제"
                    >
                      -
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEducation((prev) => [...prev, { id: createId(), value: '' }])}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm text-gray-600"
                >
                  + 학력 추가
                </button>
                <p className="mt-2 text-xs text-red-500">*helper text 2</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-black">수상 내역</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                {awards.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
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
                {certificates.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
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
                {activities.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
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
                <p className="mt-2 text-xs text-red-500">*helper text 3</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-black">파일 업로드</h2>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <Input.Root>
                  <Input.Label>파일 URL</Input.Label>
                  <Input.Field
                    value={fileUrl}
                    onChange={(event) => setFileUrl(event.target.value)}
                  />
                </Input.Root>
              </div>
            </section>

            <Button type="submit">이력서 업데이트</Button>

            <div className="rounded-2xl bg-white p-4 text-xs text-gray-600 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold text-gray-700">전송 payload 미리보기</p>
              <pre className="mt-3 whitespace-pre-wrap break-words">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
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
