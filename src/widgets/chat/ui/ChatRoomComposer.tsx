'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

type ChatRoomComposerProps = {
  draft: string;
  setDraft: (value: string) => void;
  chatStatus: 'ACTIVE' | 'CLOSED';
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  onSend: (message: string) => void;
  onOverLimit: () => void;
  onHeightChange: (height: number) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  composerRef: React.RefObject<HTMLFormElement>;
};

const maxInputHeight = 160;

export default function ChatRoomComposer({
  draft,
  setDraft,
  chatStatus,
  wsStatus,
  onSend,
  onOverLimit,
  onHeightChange,
  inputRef,
  composerRef,
}: ChatRoomComposerProps) {
  const isComposingRef = useRef(false);
  const isComposerFocusedRef = useRef(false);
  const preventMobileSubmitRef = useRef(false);
  const composerShiftRef = useRef(0);
  const isMobile =
    typeof navigator !== 'undefined' && /iphone|ipad|ipod|android/i.test(navigator.userAgent);

  const resizeInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = '0px';
    const nextHeight = Math.min(input.scrollHeight, maxInputHeight);
    input.style.height = `${nextHeight}px`;
    input.style.overflowY = input.scrollHeight > maxInputHeight ? 'auto' : 'hidden';
  }, [inputRef]);

  useLayoutEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    const updateHeight = () => {
      onHeightChange(composer.offsetHeight);
    };
    updateHeight();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(composer);
    return () => observer.disconnect();
  }, [composerRef, onHeightChange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    const composer = composerRef.current;
    if (!viewport || !composer) return;

    const updateComposerShift = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);
      const nextShift = isComposerFocusedRef.current ? keyboardHeight : 0;
      if (composerShiftRef.current === nextShift) return;
      composerShiftRef.current = nextShift;
      composer.style.transform = nextShift ? `translateY(-${nextShift}px)` : 'translateY(0)';
    };

    updateComposerShift();
    viewport.addEventListener('resize', updateComposerShift);
    viewport.addEventListener('scroll', updateComposerShift);
    return () => {
      viewport.removeEventListener('resize', updateComposerShift);
      viewport.removeEventListener('scroll', updateComposerShift);
    };
  }, [composerRef]);

  const isOverLimit = draft.length > 500;
  const isBlankDraft = draft.trim().length === 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isMobile && preventMobileSubmitRef.current) {
      preventMobileSubmitRef.current = false;
      return;
    }
    if (isBlankDraft) return;
    if (isOverLimit) {
      onOverLimit();
      return;
    }
    onSend(draft);
    setDraft('');
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      inputRef.current.style.overflowY = 'hidden';
      inputRef.current.style.height = '0px';
      requestAnimationFrame(() => {
        resizeInput();
        inputRef.current?.focus({ preventScroll: true });
      });
    }
  };

  const handleDraftChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
    resizeInput();
  };

  return (
    <form
      ref={composerRef}
      onSubmit={handleSubmit}
      className="sticky bottom-4 z-10 flex w-full max-w-none items-end gap-2 bg-[#f7f7f7] px-4 pb-0 pt-3"
    >
      <textarea
        ref={inputRef}
        value={draft}
        rows={1}
        onChange={handleDraftChange}
        onFocus={() => {
          isComposerFocusedRef.current = true;
          resizeInput();
          inputRef.current?.focus({ preventScroll: true });
        }}
        onBlur={() => {
          isComposerFocusedRef.current = false;
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || isComposingRef.current) {
            return;
          }
          if (isMobile) {
            if (event.key === 'Enter') {
              preventMobileSubmitRef.current = true;
            }
            return;
          }
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            (event.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
          }
        }}
        enterKeyHint="enter"
        placeholder="메시지를 입력하세요"
        disabled={chatStatus === 'CLOSED'}
        style={{ fontSize: '16px' }}
        className="min-h-11 max-h-40 flex-1 resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[16px] leading-5 text-neutral-900 placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 overflow-y-hidden"
      />
      <button
        type="submit"
        disabled={
          wsStatus !== 'connected' || chatStatus === 'CLOSED' || isOverLimit || isBlankDraft
        }
        onMouseDown={(event) => event.preventDefault()}
        onTouchStart={(event) => event.preventDefault()}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-main)] text-sm font-semibold text-white disabled:bg-neutral-300"
      >
        <svg
          data-slot="icon"
          fill="none"
          strokeWidth={1.5}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
          />
        </svg>
      </button>
    </form>
  );
}
