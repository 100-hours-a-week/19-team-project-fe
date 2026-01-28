'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { getResumes, type Resume } from '@/entities/resumes';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { useCommonApiErrorHandler } from '@/shared/api';
import iconResume from '@/shared/icons/icon_resume.png';
import charResume from '@/shared/icons/char_resume.png';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function ResumePage() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setResumes([]);
      setIsLoadingResumes(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingResumes(true);

    (async () => {
      try {
        const data = await getResumes();
        if (cancelled) return;
        setResumes(data.resumes ?? []);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingResumes(false);
          return;
        }
        setLoadError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoadingResumes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError]);

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-6 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <h1 className="text-2xl font-semibold text-black">이력서</h1>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : isLoadingResumes ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">이력서를 불러오는 중...</p>
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-red-500">{loadError}</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.push('/resume/edit')}
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3">
                <Image src={iconResume} alt="이력서 추가하기" width={40} height={40} />
                <div className="text-left">
                  <span className="text-base font-semibold text-text-body">이력서 추가하기</span>
                  <p className="mt-1 text-xs text-text-caption">이력서를 업데이트해 보세요</p>
                </div>
              </div>
              <span className="text-xl text-gray-300">›</span>
            </button>

            {resumes.length === 0 ? (
              <div className="mt-6 flex flex-1 items-center justify-center">
                <Image
                  src={charResume}
                  alt="이력서"
                  className="h-72 w-auto animate-float"
                  priority
                />
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                {resumes.map((resume) => (
                  <div
                    key={resume.resumeId}
                    className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => router.push(`/resume/${resume.resumeId}`)}
                          className="text-left text-base font-semibold text-text-title"
                        >
                          {resume.title}
                        </button>
                        <p className="mt-1 text-xs text-text-caption">
                          {resume.isFresher ? '신입' : '경력'} ·{' '}
                          {resume.educationLevel || '학력 정보 없음'}
                        </p>
                      </div>
                      {resume.fileUrl ? (
                        <a
                          href={resume.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-primary-main"
                        >
                          파일 보기
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-text-caption">
                      {new Date(resume.createdAt).toLocaleDateString('ko-KR')} 등록
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
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
