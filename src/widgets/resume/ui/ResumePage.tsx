'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton } from '@/features/auth';
import { useResumeList } from '@/features/resume';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import iconResume from '@/shared/icons/icon_resume.png';
import charResume from '@/shared/icons/char_resume.png';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function ResumePage() {
  const router = useRouter();
  const {
    authStatus,
    resumes,
    isLoadingResumes,
    loadError,
    openMenuId,
    setOpenMenuId,
    isDeletingId,
    handleDeleteResume,
  } = useResumeList();

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="flex flex-1 flex-col px-2.5 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <h1 className="text-2xl font-semibold text-black">이력서</h1>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : isLoadingResumes ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
            <p className="text-base text-neutral-700">이력서를 불러오는 중...</p>
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-3xl bg-white px-2.5 py-5 shadow-sm">
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
                    className="relative rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/resume/${resume.resumeId}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          router.push(`/resume/${resume.resumeId}`);
                        }
                      }}
                      className="w-full cursor-pointer text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold text-text-title">
                            {resume.title}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            aria-label="이력서 옵션"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId((prev) =>
                                prev === resume.resumeId ? null : resume.resumeId,
                              );
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 text-gray-500"
                          >
                            <svg
                              data-slot="icon"
                              fill="none"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                              className="h-4 w-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-text-caption">
                      {new Date(resume.createdAt).toLocaleDateString('ko-KR')} 등록
                    </p>

                    {openMenuId === resume.resumeId ? (
                      <div className="absolute right-4 top-10 z-10 w-28 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            router.push(`/resume/edit?resumeId=${resume.resumeId}`);
                          }}
                          className="w-full px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            if (isDeletingId) return;
                            void handleDeleteResume(resume.resumeId);
                          }}
                          className="w-full px-2.5 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                        >
                          {isDeletingId === resume.resumeId ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    ) : null}
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
