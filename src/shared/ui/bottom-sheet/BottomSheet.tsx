'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

type BottomSheetProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="re-fit-bottom-sheet-overlay fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          className="re-fit-bottom-sheet-content fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[600px] rounded-t-3xl bg-white px-6 pb-8 pt-4 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col">
            {title ? (
              <Dialog.Title className="text-center text-lg font-semibold text-text-title">
                {title}
              </Dialog.Title>
            ) : null}
            <div className="mt-4 h-px w-full bg-gray-200" aria-hidden="true" />
          </div>
          <div className="mt-6 h-[72vh] overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
