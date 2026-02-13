'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton } from '@/features/auth';
import { useAuthStatus } from '@/entities/auth';
import type { ChatRequestType } from '@/entities/chat';
import { useExpertDetail, useExpertResumes, useChatRequest } from '@/features/expert';
import { Button } from '@/shared/ui/button';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Modal } from '@/shared/ui/modal';
import defaultUserImage from '@/shared/icons/char_icon.png';
import iconMark from '@/shared/icons/icon-mark.png';
import ExpertDetailHeader from './ExpertDetailHeader';

type ExpertDetailPageProps = {
  userId: number;
};

export default function ExpertDetailPage({ userId }: ExpertDetailPageProps) {
  const router = useRouter();
  const { status: authStatus } = useAuthStatus();
  const { expert, isLoading, errorMessage } = useExpertDetail(userId);
  const { resumes, resumeError, isLoadingResumes, selectedResumeId, setSelectedResumeId } =
    useExpertResumes(authStatus);
  const [chatInfoSheetOpen, setChatInfoSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRequestType, setPendingRequestType] = useState<ChatRequestType | null>(null);
  const {
    authSheetOpen,
    setAuthSheetOpen,
    isCheckingAuth,
    jobPostUrl,
    setJobPostUrl,
    isJobPostOverLimit,
    handleChatRequestClick,
  } = useChatRequest(userId);

  const openConfirm = (requestType: ChatRequestType) => {
    setPendingRequestType(requestType);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingRequestType) return;
    setConfirmOpen(false);
    await handleChatRequestClick(selectedResumeId, pendingRequestType);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <ExpertDetailHeader />
      <section className="px-4 pt-6 pb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
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
        </div>

        {isLoading ? (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : errorMessage ? (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-red-500">에러: {errorMessage}</p>
          </div>
        ) : expert ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="rounded-3xl bg-white px-4 py-6 text-center shadow-sm">
              <div className="flex flex-col items-center">
                <Image
                  src={expert.profile_image_url || defaultUserImage}
                  alt={`${expert.nickname} 프로필`}
                  width={112}
                  height={112}
                  unoptimized={!!expert.profile_image_url}
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div className="mt-3 flex items-center gap-2">
                  <p className="text-lg font-semibold text-[#3b5bcc]">{expert.nickname}</p>
                  {expert.verified ? (
                    <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-xs font-semibold text-[#2b4b7e]">
                      인증됨
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-text-caption">
                  {expert.company_name} · {expert.jobs[0]?.name ?? '직무 정보 없음'}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                    {expert.career_level.level}
                  </span>
                  {expert.skills.length > 0 ? (
                    expert.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]"
                      >
                        {skill.name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                      기술 스택 없음
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
              <p className="text-base font-semibold text-text-title">자기 소개</p>
              <p className="mt-3 text-sm text-text-body whitespace-pre-line">
                {expert.introduction || '소개가 아직 없어요.'}
              </p>
            </div>

            <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
              <p className="text-base font-semibold text-text-title">채팅 요청 첨부</p>
              <p className="mt-2 text-xs text-text-caption">
                공고 링크와 이력서를 첨부하면 더 구체적인 피드백을 받을 수 있어요.
              </p>

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700">공고 링크</p>
                <input
                  type="url"
                  placeholder="https://example.com/job/123"
                  value={jobPostUrl}
                  onChange={(event) => setJobPostUrl(event.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-200 px-2.5 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
                />
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700">이력서 선택</p>
                {authStatus !== 'authed' ? (
                  <p className="mt-2 text-xs text-text-caption">
                    로그인 후 이력서를 선택할 수 있어요.
                  </p>
                ) : isLoadingResumes ? (
                  <p className="mt-2 text-xs text-text-caption">이력서를 불러오는 중...</p>
                ) : resumeError ? (
                  <p className="mt-2 text-xs text-red-500">{resumeError}</p>
                ) : resumes.length === 0 ? (
                  <p className="mt-2 text-xs text-text-caption">등록된 이력서가 없습니다.</p>
                ) : (
                  <select
                    value={selectedResumeId ?? 0}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setSelectedResumeId(value === 0 ? null : value);
                    }}
                    className="mt-2 w-full appearance-none rounded-md border border-gray-200 bg-white px-2.5 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
                  >
                    <option value={0}>선택 안함</option>
                    {resumes.map((resume) => (
                      <option key={resume.resumeId} value={resume.resumeId}>
                        {resume.title || `이력서 ${resume.resumeId}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
              <div className="relative pr-10">
                <p className="text-base font-semibold text-text-title">채팅 요청하기</p>
                <button
                  type="button"
                  onClick={() => setChatInfoSheetOpen(true)}
                  aria-label="채팅 요청 안내"
                  className="absolute right-0 top-0 text-primary-main"
                >
                  <svg
                    data-slot="icon"
                    fill="none"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => openConfirm('COFFEE_CHAT')}
                  disabled={isCheckingAuth || !expert || isJobPostOverLimit}
                  icon={<Image src={iconMark} alt="" width={18} height={18} />}
                  className="py-2 font-semibold"
                >
                  <span className="leading-none">커피챗</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => openConfirm('FEEDBACK')}
                  disabled={
                    isCheckingAuth ||
                    !expert ||
                    isJobPostOverLimit ||
                    !selectedResumeId ||
                    !jobPostUrl.trim()
                  }
                  icon={<Image src={iconMark} alt="" width={18} height={18} />}
                  className="py-2 font-semibold"
                >
                  <span className="leading-none">피드백</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base text-neutral-700">현직자 정보를 찾을 수 없어요.</p>
          </div>
        )}
      </section>

      <BottomSheet
        open={chatInfoSheetOpen}
        title="채팅 요청 안내"
        onClose={() => setChatInfoSheetOpen(false)}
        actionLabel="완료"
        onAction={() => setChatInfoSheetOpen(false)}
      >
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
            <p className="text-sm font-semibold text-text-title">커피챗</p>
            <p className="mt-2 text-sm text-text-body">
              가볍게 채팅으로 이야기할 수 있어요. 레포트 생성 없이 진행됩니다.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
            <p className="text-sm font-semibold text-text-title">피드백</p>
            <p className="mt-2 text-sm text-text-body">
              채팅이 끝난 뒤 현직자의 레포트가 생성됩니다.
            </p>
          </div>
        </div>
      </BottomSheet>

      <Modal
        open={confirmOpen}
        title="채팅 요청"
        description={
          pendingRequestType === 'COFFEE_CHAT'
            ? '커피챗을 요청할까요?'
            : pendingRequestType === 'FEEDBACK'
              ? '피드백을 요청할까요?'
              : null
        }
        confirmLabel="확인"
        cancelLabel="취소"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />

      <BottomSheet
        open={authSheetOpen}
        title="로그인이 필요합니다"
        onClose={() => setAuthSheetOpen(false)}
      >
        <div className="flex h-full flex-col gap-4">
          <div>
            <p className="mt-2 text-sm text-text-caption">채팅을 요청하려면 로그인해 주세요.</p>
          </div>
          <div className="mt-auto">
            <KakaoLoginButton />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
