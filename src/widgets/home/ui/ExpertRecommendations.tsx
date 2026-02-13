'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { ExpertRecommendation } from '@/entities/experts';
import defaultUserImage from '@/shared/icons/char_icon.png';

type ExpertRecommendationsProps = {
  recommendations: ExpertRecommendation[];
};

export default function ExpertRecommendations({ recommendations }: ExpertRecommendationsProps) {
  if (recommendations.length === 0) {
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
        {recommendations.map((expert, index) => (
          <Link
            key={expert.user_id ?? `expert-${index}`}
            href={`/experts/${String(expert.user_id)}`}
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
                    priority={index === 0}
                    unoptimized={!!expert.profile_image_url}
                  />
                </span>
              </span>
            </span>
            <div className="flex max-w-[90px] flex-col items-center gap-1">
              <span className="max-w-[72px] truncate text-[13px] font-semibold text-neutral-900">
                {expert.nickname}
              </span>
              {expert.verified ? (
                <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 text-[10px] font-semibold text-[#2b4b7e]">
                  인증됨
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
