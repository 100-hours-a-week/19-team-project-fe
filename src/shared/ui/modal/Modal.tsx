'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

import { Button } from '@/shared/ui/button';

type ModalProps = {
  open: boolean;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
};

export default function Modal({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: ModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onCancel();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col gap-3">
            {title ? (
              <Dialog.Title className="text-center text-lg font-semibold text-text-title">
                {title}
              </Dialog.Title>
            ) : null}
            {description ? (
              <Dialog.Description className="text-center text-sm text-text-body">
                {description}
              </Dialog.Description>
            ) : null}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button type="button" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
