'use client';

import Image from 'next/image';

import avatar1 from '@/shared/icons/char_icon.png';
import avatar2 from '@/shared/icons/char_main.png';
import avatar3 from '@/shared/icons/char_ready.png';
import avatar4 from '@/shared/icons/char_logout.png';

const MOCK_EXPERTS = [
  { id: 1, name: 'sabanok...', image: avatar1 },
  { id: 2, name: 'blue_bouy', image: avatar2 },
  { id: 3, name: 'waggles', image: avatar3 },
  { id: 4, name: 'steve.loves', image: avatar4 },
  { id: 5, name: 'dev.jun', image: avatar1 },
  { id: 6, name: 'refit.mentor', image: avatar2 },
  { id: 7, name: 'career.chat', image: avatar3 },
  { id: 8, name: 'frontend.s', image: avatar4 },
  { id: 9, name: 'backend.k', image: avatar1 },
  { id: 10, name: 'pm.lead', image: avatar2 },
];

export default function ExpertRecommendations() {
  return (
    <div className="px-2.5 pt-3 pb-5">
      <p className="text-sm font-semibold text-neutral-900">현직자 추천</p>
      <div className="mt-3 flex items-start gap-3 overflow-x-auto pb-2 pr-2 snap-x snap-mandatory scrollbar-hide">
        {MOCK_EXPERTS.map((expert, index) => (
          <button
            key={expert.id}
            type="button"
            className="flex min-w-[84px] flex-col items-center gap-2 snap-start"
          >
            <span className="rounded-full bg-gradient-to-br from-[var(--color-primary-main)] via-[#4a6fb3] to-[var(--color-primary-sub)] p-[3px]">
              <span className="block rounded-full bg-white p-[2px]">
                <span className="relative block h-[68px] w-[68px] overflow-hidden rounded-full bg-white">
                <Image
                  src={expert.image}
                  alt=""
                  fill
                  sizes="68px"
                  className="object-cover"
                  priority={index === 0}
                />
                </span>
              </span>
            </span>
            <span className="max-w-[78px] truncate text-[13px] font-semibold text-neutral-900">
              {expert.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
