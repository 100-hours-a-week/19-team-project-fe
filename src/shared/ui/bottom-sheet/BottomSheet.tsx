'use client';

import type { ReactNode } from 'react';
import { BottomSheet as SpringBottomSheet } from 'react-spring-bottom-sheet';

type BottomSheetProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  return (
    <SpringBottomSheet
      open={open}
      onDismiss={onClose}
      className="re-fit-bottom-sheet"
      scrollLocking
      header={
        title ? (
          <div className="flex items-center justify-between px-6 pt-2">
            <h2 className="text-lg font-semibold text-text-title">{title}</h2>
            <button type="button" className="text-xl text-text-caption" onClick={onClose}>
              ×
            </button>
          </div>
        ) : null
      }
    >
      <div className="px-6 pb-8 pt-2">
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </SpringBottomSheet>
  );
}
