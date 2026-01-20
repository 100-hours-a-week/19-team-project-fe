'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/ui/button';
import iconMark from '@/shared/icons/icon-mark.png';

type RoleId = 'seeker' | 'expert';

const ROLE_COPY = {
  seeker: {
    title: '구직자',
    tagline: '나에게 맞는 공고와 준비 플로우를 빠르게.',
    description: [
      '맞춤 공고 큐레이션',
      '포트폴리오 체크리스트',
      '이력서 문항 AI 피드백',
    ],
    accent: 'text-[#2b4b7e]',
    bg: 'from-[#b0d8e4] via-[#b0d8e4] to-[#b0d8e4]',
    imageBg: 'bg-white/60',
  },
  expert: {
    title: '현직자',
    tagline: '경험을 나누고, 프로필 가치를 높여요.',
    description: [
      '상담 요청 관리',
      '전문 분야 노출',
      '리워드 정산 내역',
    ],
    accent: 'text-[#7b2b4b]',
    bg: 'from-[#dc8aa1] via-[#dc8aa1] to-[#dc8aa1]',
    imageBg: 'bg-white/45',
  },
} as const;

export default function OnboardingRoleSelect() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<RoleId>('seeker');
  const roles = Object.entries(ROLE_COPY) as [RoleId, typeof ROLE_COPY.seeker][];

  return (
    <main className="flex min-h-screen flex-col bg-white pb-10 pt-12 text-text-body">
      <header className="relative px-6">
        <button
          type="button"
          className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl text-text-caption"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <div className="mx-auto max-w-xs text-center">
          <div className="flex justify-center">
            <Image src={iconMark} alt="re-fit" width={36} height={36} priority />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-text-caption">
            onboarding
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-text-title">
            어떤 서비스를 이용하고 싶으세요
          </h1>
          <p className="mt-3 text-sm text-text-caption">
            선택한 유형에 맞춘 안내로 회원가입을 도와드릴게요.
          </p>
        </div>
      </header>

      <section className="relative mt-8 flex flex-1 pb-24">
        <div className="absolute inset-x-0 top-0 bottom-24 flex">
          {roles.map(([roleId, role]) => {
            const isActive = activeRole === roleId;

            return (
              <button
                key={roleId}
                type="button"
                onClick={() => setActiveRole(roleId)}
                aria-pressed={isActive}
                className={`relative flex h-full flex-[1] flex-col overflow-hidden bg-gradient-to-br ${role.bg} p-8 text-left transition-all duration-500 ${
                  isActive
                    ? 'flex-[2.2] scale-[1.01] opacity-100 shadow-[inset_0_0_18px_rgba(0,0,0,0.2)]'
                    : 'flex-[0.65] scale-[0.98] opacity-90 brightness-[0.7] saturate-75'
                }`}
              >
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex justify-end">
                    <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-medium text-text-caption">
                      {isActive ? '선택됨' : '클릭'}
                    </span>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <div
                      className={`h-28 w-28 rounded-full ${role.imageBg} shadow-[0_18px_40px_rgba(0,0,0,0.2)]`}
                    />
                  </div>

                  <div className="mt-4 flex-1">
                    <p className={`text-3xl font-semibold ${role.accent}`}>{role.title}</p>
                    {isActive ? (
                      <>
                        <p className="mt-3 text-lg font-medium text-text-body">{role.tagline}</p>
                        <ul className="mt-5 space-y-2 text-base text-text-caption-strong">
                          {role.description.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>

                  {!isActive ? (
                    <div className="mt-auto text-xs font-semibold tracking-[0.2em] text-white/70 animate-pulse">
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
              onClick={() => router.push(`/onboarding/profile?role=${activeRole}`)}
            >
              가입 완료
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
