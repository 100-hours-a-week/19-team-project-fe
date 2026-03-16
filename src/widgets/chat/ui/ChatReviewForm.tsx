'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useChatCurrentUser, useChatReviewForm, useChatRoomDetail } from '@/features/chat';
import { Button } from '@/shared/ui/button';
import iconMark from '@/shared/icons/icon-mark.png';

interface ChatReviewFormProps {
  chatId: number;
}

function StarButton({
  active,
  onClick,
  index,
}: {
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center p-1 text-neutral-400 transition"
      aria-label={`${index}점 선택`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        className={`h-7 w-7 ${active ? 'text-[var(--color-primary-main)]' : 'text-neutral-400'}`}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.5a.53.53 0 0 1 1.04 0l2.07 6.36a.53.53 0 0 0 .5.37h6.69a.53.53 0 0 1 .31.96l-5.42 3.94a.53.53 0 0 0-.19.59l2.07 6.36a.53.53 0 0 1-.82.6l-5.42-3.94a.53.53 0 0 0-.62 0l-5.42 3.94a.53.53 0 0 1-.82-.6l2.07-6.36a.53.53 0 0 0-.19-.59L2.2 11.19a.53.53 0 0 1 .31-.96H9.2a.53.53 0 0 0 .5-.37z"
        />
      </svg>
    </button>
  );
}

export default function ChatReviewForm({ chatId }: ChatReviewFormProps) {
  const router = useRouter();
  const { currentUserId, isLoading: isUserLoading } = useChatCurrentUser();
  const {
    isLoading: isDetailLoading,
    isFeedbackChat,
    chatStatus,
    isRequester,
  } = useChatRoomDetail(chatId, currentUserId);
  const {
    rating,
    comment,
    isSubmitting,
    submitError,
    canSubmit,
    maxCommentLength,
    updateRating,
    updateComment,
    submitReview,
  } = useChatReviewForm(chatId);
  const isReviewAllowed = isFeedbackChat && chatStatus === 'CLOSED' && isRequester;
  const isGuardLoading = isUserLoading || isDetailLoading;

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f4f4f4] text-black"
      style={{ '--app-header-height': '64px' } as CSSProperties}
    >
      <header className="fixed top-0 left-1/2 z-10 flex h-16 w-full max-w-[600px] -translate-x-1/2 items-center bg-white px-4 shadow-sm">
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('nav-direction', 'back');
            router.back();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600"
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
        <div className="flex-1 px-3 text-center text-base font-semibold text-neutral-900">
          리뷰 작성
        </div>
        <div className="h-9 w-9" aria-hidden="true" />
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[600px] flex-1 flex-col gap-4 overflow-y-auto bg-[#f4f4f4] px-2.5 pb-4 pt-[calc(var(--app-header-height)+16px)]">
        {isGuardLoading ? (
          <section className="rounded-2xl bg-white p-4 text-center text-sm text-neutral-600 shadow-sm">
            채팅 정보를 확인하는 중입니다...
          </section>
        ) : isReviewAllowed ? (
          <>
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h1 className="text-sm font-semibold text-neutral-900">채팅이 종료되었습니다.</h1>
              <p className="mt-2 text-xs text-neutral-600">
                채팅 상대방의 응답 품질을 기준으로 별점과 리뷰를 작성해 주세요.
              </p>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-neutral-900">별점</h2>
              <p className="mt-1 text-xs text-neutral-500">1점(아쉬움) ~ 5점(매우 만족)</p>
              <div className="mt-3 flex items-center gap-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const score = index + 1;
                  return (
                    <StarButton
                      key={score}
                      index={score}
                      active={score <= rating}
                      onClick={() => updateRating(score)}
                    />
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-neutral-900">리뷰 내용</h2>
              <textarea
                value={comment}
                onChange={(event) => {
                  updateComment(event.target.value);
                }}
                rows={7}
                placeholder="상대방의 답변이 어떤 점에서 도움이 되었는지 적어주세요."
                className="mt-3 min-h-[140px] w-full resize-y rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 outline-none focus:border-neutral-500"
              />
              <p className="mt-1 text-right text-xs text-neutral-400">
                {comment.length}/{maxCommentLength}
              </p>
            </section>
          </>
        ) : (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h1 className="text-sm font-semibold text-neutral-900">리뷰 작성 불가</h1>
            <p className="mt-2 text-xs text-neutral-600">
              종료된 피드백 채팅에서 요청자에게만 리뷰 작성이 허용됩니다.
            </p>
          </section>
        )}
      </main>

      <div className="mx-auto w-full max-w-[600px] shrink-0 bg-[#f4f4f4] px-2.5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
        {submitError ? (
          <p className="mb-2 text-center text-xs text-red-500">{submitError}</p>
        ) : null}
        <Button
          type="button"
          onClick={() => {
            if (isGuardLoading || !isReviewAllowed || !canSubmit || isSubmitting) return;
            void submitReview();
          }}
          disabled={isGuardLoading || !isReviewAllowed || !canSubmit || isSubmitting}
          aria-disabled={isGuardLoading || !isReviewAllowed || !canSubmit || isSubmitting}
          icon={<Image src={iconMark} alt="" width={20} height={20} />}
          className="mt-0 rounded-2xl py-3 text-sm font-semibold enabled:bg-[var(--color-primary-main)] enabled:hover:bg-[var(--color-primary-main)] enabled:active:bg-[var(--color-primary-main)] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? '제출 중...' : '리뷰 제출하기'}
        </Button>
      </div>
    </div>
  );
}
