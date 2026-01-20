'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type BottomSheetProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const lastOffsetRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mounted) return null;

  const effectiveDragOffset = open ? dragOffset : 0;
  const effectiveDragging = open && isDragging;

  const handleClose = () => {
    setDragOffset(0);
    setIsDragging(false);
    onClose();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    setIsDragging(true);
    startYRef.current = event.clientY;
    lastOffsetRef.current = dragOffset;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const delta = event.clientY - startYRef.current;
    setDragOffset(Math.max(0, lastOffsetRef.current + delta));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 120) {
      handleClose();
      return;
    }
    setDragOffset(0);
  };

  return createPortal(
    <div
      className={`fixed inset-y-0 left-1/2 z-40 w-full max-w-[600px] -translate-x-1/2 ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-3xl bg-white px-6 pb-8 pt-3 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        } ${effectiveDragging ? 'transition-none' : ''}`}
        style={{ transform: open ? `translateY(${effectiveDragOffset}px)` : 'translateY(100%)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col">
          <button
            type="button"
            className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label="바텀시트 드래그"
          />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-title">{title}</h2>
            <button type="button" className="text-xl text-text-caption" onClick={handleClose}>
              ×
            </button>
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
