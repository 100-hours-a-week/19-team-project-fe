'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton } from '@/features/auth';
import { useResumeList } from '@/features/resume';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import iconResume from '@/shared/icons/icon_resume.png';
import charResume from '@/shared/icons/char_resume.png';
import { formatKstString } from '@/shared/lib/date';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function ResumePage() {
  const router = useRouter();
  const {
    authStatus,
    resumes,
    pendingTasks,
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
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#eef1f6] text-black">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-120px] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(53,85,139,0.18)_0%,_rgba(53,85,139,0)_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-64 left-[-160px] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(101,119,140,0.14)_0%,_rgba(101,119,140,0)_72%)]"
      />
      <Header />

      <section className="relative z-10 flex flex-1 flex-col px-2.5 pb-[calc(var(--app-footer-height)+16px)] pt-6">
        <div className="mt-3 rounded-3xl border border-white/60 bg-[linear-gradient(135deg,#35558b_0%,#65778c_100%)] px-5 py-5 text-white shadow-[0_16px_36px_rgba(31,46,71,0.25)]">
          <p className="text-xs font-semibold tracking-[0.14em] text-white/80">RESUME STUDIO</p>
          <p className="mt-2 text-lg font-semibold leading-snug">
            최신 이력서를 정리하고
            <br />
            피드백 준비를 빠르게 진행하세요
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold">
            총 {resumes.length + pendingTasks.length}개
          </div>
        </div>

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
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[#dbe2ec] bg-white p-4 shadow-[0_14px_32px_rgba(22,33,53,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(22,33,53,0.12)]"
            >
              <div className="flex items-center gap-3">
                <Image src={iconResume} alt="이력서 추가하기" width={40} height={40} />
                <div className="text-left">
                  <span className="text-base font-semibold text-[#1f2f46]">이력서 추가하기</span>
                  <p className="mt-1 text-xs text-[#5f6f85]">이력서를 업데이트해 보세요</p>
                </div>
              </div>
              <span className="text-xl text-[#7f8ea4]">›</span>
            </button>

            {resumes.length === 0 && pendingTasks.length === 0 ? (
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
                {pendingTasks.map((task) => (
                  <div
                    key={task.taskId}
                    className="relative rounded-2xl border border-[#dde5ef] bg-white px-5 py-4 shadow-[0_14px_32px_rgba(23,33,52,0.08)]"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute bottom-3 left-3 top-3 w-1.5 rounded-full bg-gradient-to-b from-[#9aa7b8] to-[#c7d0db]"
                    />
                    <div className="w-full pl-4 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold text-[#1f2f46]">이력서 생성 중</p>
                          <p className="mt-2 inline-flex rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[11px] font-semibold text-[#5f6f85]">
                            PROCESSING
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-[#6b7b92]">
                        AI가 이력서를 생성하고 있습니다.
                      </p>
                    </div>
                    <p className="mt-2 pl-4 text-xs text-[#6b7b92]">
                      {formatKstString(task.createdAt, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      }) ?? task.createdAt}{' '}
                      요청
                    </p>
                  </div>
                ))}
                {resumes.map((resume) => (
                  <div
                    key={resume.resumeId}
                    className="relative rounded-2xl border border-[#dde5ef] bg-white px-5 py-4 shadow-[0_14px_32px_rgba(23,33,52,0.08)]"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute bottom-3 left-3 top-3 w-1.5 rounded-full bg-gradient-to-b from-[#35558b] to-[#8aa0bf]"
                    />
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
                      className="w-full cursor-pointer pl-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold text-[#1f2f46]">{resume.title}</p>
                          <p className="mt-2 inline-flex rounded-full bg-[#edf4ff] px-2.5 py-1 text-[11px] font-semibold text-[#35558b]">
                            {resume.status?.toUpperCase() === 'PROCESSING'
                              ? 'PROCESSING'
                              : 'RESUME'}
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
                    <p className="mt-2 pl-4 text-xs text-[#6b7b92]">
                      {formatKstString(resume.createdAt, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      }) ?? resume.createdAt}{' '}
                      등록
                    </p>

                    {openMenuId === resume.resumeId ? (
                      <div className="absolute right-4 top-10 z-10 w-28 border border-gray-100 bg-white py-2 shadow-lg">
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
