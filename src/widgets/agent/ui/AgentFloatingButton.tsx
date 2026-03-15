'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Content as DialogContent,
  Overlay as DialogOverlay,
  Portal as DialogPortal,
  Root as DialogRoot,
  Title as DialogTitle,
} from '@radix-ui/react-dialog';

import { useAuthStatus } from '@/entities/auth';
import { KakaoLoginButton } from '@/features/auth';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import AgentConsole from './AgentConsole';

export default function AgentFloatingButton() {
  const pathname = usePathname();
  const { status: authStatus } = useAuthStatus();
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [agentSheetOpen, setAgentSheetOpen] = useState(false);

  if (pathname !== '/') return null;

  const handleOpenAgent = () => {
    if (authStatus === 'authed') {
      setAgentSheetOpen(true);
      return;
    }

    if (authStatus === 'guest') {
      setAuthSheetOpen(true);
    }
  };

  return (
    <>
      <div className="pointer-events-none fixed bottom-[calc(var(--app-footer-height)+16px)] left-1/2 z-40 flex w-full max-w-[600px] -translate-x-1/2 justify-end px-4">
        <div className="relative pointer-events-auto">
          <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full text-xs font-extrabold leading-none text-[#ff3b30]">
            NEW
          </span>
          <button
            type="button"
            onClick={handleOpenAgent}
            disabled={authStatus === 'checking'}
            aria-label="에이전트 열기"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-main text-white shadow-[0_12px_30px_rgba(53,85,139,0.42)] transition hover:bg-[#2e4a77] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              data-slot="icon"
              fill="none"
              strokeWidth="1.5"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
          </button>
        </div>
      </div>

      <AuthGateSheet
        open={authSheetOpen}
        title="로그인이 필요합니다"
        description="에이전트 기능은 로그인한 회원만 사용할 수 있습니다."
        onClose={() => setAuthSheetOpen(false)}
      >
        <KakaoLoginButton />
      </AuthGateSheet>

      <DialogRoot open={agentSheetOpen} onOpenChange={setAgentSheetOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/40" />
          <DialogContent
            className="fixed left-1/2 top-1/2 z-50 flex h-[min(86vh,760px)] w-[min(calc(100vw-20px),580px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-[#dbe3ee] bg-white shadow-[0_24px_70px_rgba(16,30,55,0.3)]"
            role="dialog"
            aria-modal="true"
          >
            <DialogTitle className="sr-only">AI Agent</DialogTitle>
            <div className="flex items-center justify-end border-b border-[#e5ebf3] px-3 py-2">
              <button
                type="button"
                onClick={() => setAgentSheetOpen(false)}
                aria-label="에이전트 닫기"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#4f6282] transition hover:bg-[#edf2f9]"
              >
                <svg
                  data-slot="icon"
                  fill="none"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 p-2.5">
              <AgentConsole compact />
            </div>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
    </>
  );
}
