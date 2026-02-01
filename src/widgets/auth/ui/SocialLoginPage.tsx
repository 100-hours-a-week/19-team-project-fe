'use client';

import { useState } from 'react';
import Image from 'next/image';

import { KakaoLoginButton } from '@/features/auth';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import charSns from '@/shared/icons/char_sns.png';

export default function SocialLoginPage() {
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#fff8cc] via-white to-white px-2.5 py-16 text-gray-900">
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="text-center">
          <p className="text-base font-semibold text-black">
            로그인 후 현직자 피드백을 Report로 받아보세요
          </p>
        </header>
        <div className="mt-6 flex flex-1 items-center justify-center">
          <Image src={charSns} alt="소셜 로그인 캐릭터" className="h-64 w-auto" priority />
        </div>
        <div className="mt-6">
          <KakaoLoginButton />
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-2.5 py-3 text-sm font-semibold text-black shadow-sm transition active:scale-[0.99]"
          >
            이용약관
          </button>
        </div>
      </section>

      <BottomSheet open={termsOpen} title="이용약관" onClose={() => setTermsOpen(false)}>
        <section className="space-y-4 text-sm text-text-body">
          <p className="leading-relaxed">
            서비스 이용을 위해 아래 내용을 확인해주세요. 본 약관은 서비스 운영 정책에 따라 변경될 수
            있습니다.
          </p>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text-title">1. 서비스 이용</h3>
            <p className="leading-relaxed">
              회원은 본 서비스가 제공하는 기능을 이용할 수 있으며, 서비스의 안정적인 운영을 위해
              회사가 정한 정책을 준수해야 합니다.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text-title">2. 계정 및 보안</h3>
            <p className="leading-relaxed">
              계정 정보는 회원 본인이 관리해야 하며, 제3자에게 공유하거나 양도할 수 없습니다.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text-title">3. 개인정보 처리</h3>
            <p className="leading-relaxed">
              서비스 제공을 위해 필요한 범위 내에서 개인정보를 수집·이용하며, 관련 법령을
              준수합니다.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text-title">4. 문의</h3>
            <p className="leading-relaxed">약관과 관련된 문의는 고객센터를 통해 접수해주세요.</p>
          </div>
        </section>
        <button
          type="button"
          onClick={() => setTermsOpen(false)}
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-black px-2.5 py-3 text-sm font-semibold text-white transition active:scale-[0.99]"
        >
          닫기
        </button>
      </BottomSheet>
    </main>
  );
}
