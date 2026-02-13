'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

import type { ExpertRecommendation } from '@/entities/experts';
import defaultUserImage from '@/shared/icons/char_icon.png';

type ExpertRecommendationsProps = {
  recommendations: ExpertRecommendation[];
};

type StoryViewerProps = {
  isOpen: boolean;
  recommendations: ExpertRecommendation[];
  activeIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectExpert: (userId: number) => void;
  durationMs: number;
};

const StoryViewer = memo(function StoryViewer({
  isOpen,
  recommendations,
  activeIndex,
  onClose,
  onNext,
  onPrev,
  onSelectExpert,
  durationMs,
}: StoryViewerProps) {
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null) return;
      const endX = event.changedTouches[0]?.clientX ?? 0;
      const deltaX = endX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(deltaX) < 40) return;
      if (deltaX < 0) {
        onNext();
      } else {
        onPrev();
      }
    },
    [onNext, onPrev],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex h-full w-full flex-col bg-black/90"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center gap-1 px-4 pt-4">
        {recommendations.map((_, index) => {
          if (index < activeIndex) {
            return (
              <div key={`progress-${index}`} className="h-1 flex-1 rounded-full bg-white/25">
                <div className="h-full w-full rounded-full bg-white" />
              </div>
            );
          }
          if (index === activeIndex) {
            return (
              <div key={`progress-${index}`} className="h-1 flex-1 rounded-full bg-white/25">
                <div
                  key={`progress-active-${activeIndex}`}
                  className="story-progress-bar h-full w-full rounded-full bg-white"
                  style={{ animationDuration: `${durationMs}ms` }}
                  onAnimationEnd={onNext}
                />
              </div>
            );
          }
          return (
            <div key={`progress-${index}`} className="h-1 flex-1 rounded-full bg-white/25">
              <div className="h-full w-0 rounded-full bg-white" />
            </div>
          );
        })}
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white"
        >
          닫기
        </button>
      </div>

      <div className="relative mt-4 flex h-full w-full overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {recommendations.map((expert, index) => (
            <div
              key={`story-${expert.user_id ?? index}`}
              className="flex h-full w-full shrink-0 flex-col items-center justify-center px-6 pb-10 pt-6 text-white"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-gradient-to-br from-[var(--color-primary-main)] via-[#4a6fb3] to-[var(--color-primary-sub)] p-[3px]">
                  <div className="relative h-[180px] w-[180px] overflow-hidden rounded-full bg-white p-[3px]">
                    <Image
                      src={expert.profile_image_url || defaultUserImage}
                      alt={`${expert.nickname} 프로필`}
                      fill
                      sizes="180px"
                      className="rounded-full object-cover"
                      unoptimized={!!expert.profile_image_url}
                    />
                  </div>
                </div>
                <p className="mt-4 text-xl font-semibold">{expert.nickname}</p>
                <p className="mt-1 text-sm text-white/80">
                  {expert.company_name} · {expert.jobs[0] ?? '직무 정보 없음'}
                </p>
                {expert.verified ? (
                  <span className="mt-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    인증됨
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {expert.skills?.slice(0, 4).map((skill) => (
                  <span
                    key={`${expert.user_id}-${skill}`}
                    className="rounded-full border border-white/30 px-3 py-1 text-xs text-white/90"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="mt-4 line-clamp-3 text-center text-sm text-white/80">
                {expert.introduction || '소개가 아직 없어요.'}
              </p>

              <button
                type="button"
                onClick={() => {
                  if (!expert.user_id) return;
                  onClose();
                  onSelectExpert(expert.user_id);
                }}
                className="mt-8 w-full max-w-[240px] rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#2b4b7e]"
              >
                상세 보기
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onPrev}
          className="absolute left-0 top-0 h-full w-1/3"
          aria-label="이전"
        />
        <button
          type="button"
          onClick={onNext}
          className="absolute right-0 top-0 h-full w-1/3"
          aria-label="다음"
        />
      </div>
    </div>
  );
});

export default function ExpertRecommendations({ recommendations }: ExpertRecommendationsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const durationMs = 3000;

  const safeRecommendations = useMemo(
    () => recommendations.filter((item) => item && item.nickname),
    [recommendations],
  );

  const openStory = useCallback((index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  }, []);

  const closeStory = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => {
      const next = prev + 1;
      if (next >= safeRecommendations.length) {
        closeStory();
        return prev;
      }
      return next;
    });
  }, [closeStory, safeRecommendations.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeIndex >= safeRecommendations.length) {
      closeStory();
    }
  }, [activeIndex, closeStory, isOpen, safeRecommendations.length]);

  if (safeRecommendations.length === 0) {
    return (
      <div className="px-2.5 pt-3 pb-5">
        <p className="text-sm font-semibold text-neutral-900">현직자 추천</p>
        <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-text-caption">
          추천 현직자가 아직 없어요.
        </div>
      </div>
    );
  }

  return (
    <div className="px-2.5 pt-3 pb-5">
      <p className="text-sm font-semibold text-neutral-900">현직자 추천</p>
      <div className="mt-3 flex items-start gap-3 overflow-x-auto pb-2 pr-2 snap-x snap-mandatory scrollbar-hide">
        {safeRecommendations.map((expert, index) => (
          <button
            key={expert.user_id ?? `expert-${index}`}
            type="button"
            onClick={() => openStory(index)}
            className="flex min-w-[92px] flex-col items-center gap-2 snap-start"
          >
            <span className="rounded-full bg-gradient-to-br from-[var(--color-primary-main)] via-[#4a6fb3] to-[var(--color-primary-sub)] p-[3px]">
              <span className="block rounded-full bg-white p-[2px]">
                <span className="relative block h-[68px] w-[68px] overflow-hidden rounded-full bg-white">
                  <Image
                    src={expert.profile_image_url || defaultUserImage}
                    alt={`${expert.nickname} 프로필`}
                    fill
                    sizes="68px"
                    className="object-cover"
                    unoptimized={!!expert.profile_image_url}
                  />
                </span>
              </span>
            </span>
            <div className="flex max-w-[110px] items-center justify-center gap-0.5">
              <span className="max-w-[72px] truncate text-[13px] font-semibold text-neutral-900">
                {expert.nickname}
              </span>
              {expert.verified ? (
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2b4b7e] text-white">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      <StoryViewer
        isOpen={isOpen}
        recommendations={safeRecommendations}
        activeIndex={activeIndex}
        onClose={closeStory}
        onNext={goNext}
        onPrev={goPrev}
        onSelectExpert={(userId) => router.push(`/experts/${String(userId)}`)}
        durationMs={durationMs}
      />
    </div>
  );
}
