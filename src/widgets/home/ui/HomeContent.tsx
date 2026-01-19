'use client';

import Image from 'next/image';

import iconMark from '@/shared/icons/icon-mark.png';
import { Button } from '@/shared/ui/button';

export default function HomeContent() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full text-center">
        <p className="mb-6 text-2xl font-semibold text-primary-main">프리텐다드와 프라이머리 컬러 테스트</p>
        <Button icon={<Image src={iconMark} alt="" width={24} height={24} />}>가입 완료</Button>
      </div>
    </main>
  );
}
