'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/ui/button';
import iconMark from '@/shared/icons/icon-mark.png';
import onboardingExpert from '@/shared/icons/onboarding-expert.png';
import onboardingSeeker from '@/shared/icons/onboarding-seeker.png';

type RoleId = 'seeker' | 'expert';

const ROLE_COPY = {
  seeker: {
    title: '구직자',
    tagline: '이력서와 공고를 업데이트하고, 커리어 챗으로 맞춤 리포트를 받아보세요.',
    accent: 'text-[#2b4b7e]',
    bg: 'from-[#b0d8e4] via-[#b0d8e4] to-[#b0d8e4]',
    imageBg: 'bg-white/60',
    image: onboardingSeeker,
  },
  expert: {
    title: '현직자',
    tagline: '현직자의 경험으로 후배의 커리어를 응원해주세요.?',
    accent: 'text-[#7b2b4b]',
    bg: 'from-[#dc8aa1] via-[#dc8aa1] to-[#dc8aa1]',
    imageBg: 'bg-white/45',
    image: onboardingExpert,
  },
} as const;

export default function OnboardingRoleSelect() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<RoleId>('seeker');
  const roles = Object.entries(ROLE_COPY) as [RoleId, typeof ROLE_COPY.seeker][];

  return (
    <main className="flex min-h-screen flex-col bg-white pb-10 pt-4 text-text-body">
      <header className="relative px-6">
        <div className="mx-auto max-w-xs text-center">
          <h1 className="mt-4 text-2xl font-semibold text-text-title">
            어떤 서비스를 이용하고 싶으세요
          </h1>
          <p className="mt-3 text-sm text-text-caption">
            선택한 유형에 맞춘 안내로 회원가입을 도와드릴게요.
          </p>
        </div>
      </header>

      <section className="relative mt-8 flex flex-1 overflow-hidden pb-24">
        <div className="absolute inset-x-0 top-0 bottom-24 flex">
          {roles.map(([roleId, role]) => {
            const isActive = activeRole === roleId;

            return (
              <button
                key={roleId}
                type="button"
                onClick={() => setActiveRole(roleId)}
                aria-pressed={isActive}
                className={`relative flex h-full flex-[1] flex-col overflow-hidden bg-gradient-to-br ${role.bg} p-8 text-center transition-all duration-500 ${
                  isActive
                    ? 'flex-[2.2] opacity-100 shadow-[inset_0_0_18px_rgba(0,0,0,0.2)]'
                    : 'flex-[0.65] opacity-90 brightness-[0.7] saturate-75'
                }`}
              >
                <div className="relative z-10 flex h-full flex-col items-center">
                  <div className="-mt-5 -mr-10 flex w-full justify-end">
                    <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-medium text-text-caption">
                      {isActive ? '선택됨' : '클릭'}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center">
                    <Image
                      src={role.image}
                      alt={`${role.title} 아이콘`}
                      width={120}
                      height={120}
                      className="h-30 w-30 object-contain"
                    />
                    <p className={`mt-4 text-2xl font-bold ${role.accent}`}>{role.title}</p>
                    <p
                      className={`mt-3 min-h-[3.5rem] text-lg font-medium text-text-body transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {role.tagline}
                    </p>
                  </div>

                  {!isActive ? (
                    <div className="mt-auto text-xs font-bold tracking-[0.2em] text-white/70 animate-pulse">
                      TAP
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 pb-2">
          <div className="pointer-events-auto px-2.5">
            <Button
              icon={<Image src={iconMark} alt="" width={20} height={20} />}
              onClick={() =>
                router.push(
                  `/onboarding/profile?role=${activeRole === 'expert' ? 'EXPERT' : 'SEEKER'}`,
                )
              }
            >
              다음 단계
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
