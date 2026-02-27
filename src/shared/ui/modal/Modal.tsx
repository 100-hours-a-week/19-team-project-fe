'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

import { Button } from '@/shared/ui/button';

type ModalProps = {
  open: boolean;
  title?: string;
  description?: ReactNode;
  compact?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
};

export default function Modal({
  open,
  title,
  description,
  compact = false,
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
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] ${
            compact ? 'max-w-[360px] px-5 py-4' : 'max-w-[420px] px-6 py-5'
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
            {title ? (
              <Dialog.Title
                className={`text-center font-semibold text-text-title ${
                  compact ? 'text-base' : 'text-lg'
                }`}
              >
                {title}
              </Dialog.Title>
            ) : null}
            {description ? (
              <Dialog.Description
                className={`text-center text-text-body ${compact ? 'text-xs' : 'text-sm'}`}
              >
                {description}
              </Dialog.Description>
            ) : null}
          </div>
          <div className={`grid grid-cols-2 ${compact ? 'mt-4 gap-2' : 'mt-6 gap-3'}`}>
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
