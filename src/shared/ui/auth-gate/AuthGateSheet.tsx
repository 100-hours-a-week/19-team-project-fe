'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import charSns from '@/shared/icons/char_sns.png';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

type AuthGateSheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function AuthGateSheet({
  open,
  title,
  description,
  onClose,
  children,
}: AuthGateSheetProps) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <div className="flex h-full flex-col gap-2">
        <div className="pt-10 text-center">
          <p className="text-base font-semibold text-black">
            로그인 후 현직자 피드백을 Report로 받아보세요
          </p>
          {description ? <p className="mt-2 text-sm text-text-caption">{description}</p> : null}
        </div>
        <div className="flex flex-1 items-start justify-center pt-16">
          <Image src={charSns} alt="소셜 로그인 캐릭터" className="-mb-6 h-80 w-auto" priority />
        </div>
        <div className="-mt-12">{children}</div>
      </div>
    </BottomSheet>
  );
}
