'use client';

import { useState } from 'react';
import Image from 'next/image';
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
import charAi from '@/shared/icons/char_ai.png';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import AgentConsole from './AgentConsole';

export default function AgentFloatingButton() {
  const pathname = usePathname();
  const { status: authStatus } = useAuthStatus();
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [agentSheetOpen, setAgentSheetOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        <div className="relative pointer-events-auto flex items-center justify-end">
          <div
            className={`relative overflow-hidden rounded-full bg-[#17315f] text-white shadow-[0_12px_30px_rgba(53,85,139,0.42)] transition-all duration-300 ${
              isCollapsed ? 'h-12 w-12' : 'h-[94px] w-[min(calc(100vw-32px),560px)]'
            }`}
          >
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                aria-label="에이전트 배너 펼치기"
                className="flex h-full w-full items-center justify-center text-[#8fa7cf]"
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
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  />
                </svg>
              </button>
            ) : (
              <div className="flex h-full items-center pl-3 pr-3">
                <button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  aria-label="에이전트 배너 접기"
                  className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#4f6fa8] transition hover:bg-white/10"
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAgent}
                  disabled={authStatus === 'checking'}
                  aria-label="에이전트 열기"
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold leading-tight">
                      현직자 추천 에이전트입니다.
                    </p>
                    <p className="mt-1 truncate text-[17px] font-semibold leading-tight">
                      쉽고 빠르게 추천받아보세요!
                    </p>
                  </div>
                  <Image
                    src={charAi}
                    alt="AI 에이전트"
                    className="h-[72px] w-[72px] shrink-0 object-contain"
                    priority
                  />
                </button>
              </div>
            )}
          </div>
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
