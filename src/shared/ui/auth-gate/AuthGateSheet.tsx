'use client';

import type { ReactNode } from 'react';

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
      <div className="flex h-full flex-col gap-4">
        {description ? (
          <div>
            <p className="mt-2 text-sm text-text-caption">{description}</p>
          </div>
        ) : null}
        <div className="mt-auto">{children}</div>
      </div>
    </BottomSheet>
  );
}
