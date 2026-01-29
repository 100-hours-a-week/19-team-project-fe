'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ChatDetailData, ChatParticipant } from '@/entities/chat';
import { closeChat } from '@/features/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

type ChatDetailProps = {
  chatId: number;
  detail: ChatDetailData;
};

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getUserTypeLabel = (value?: string) => {
  if (!value) return '알 수 없음';
  return value === 'EXPERT' ? '전문가' : value;
};

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 text-sm text-neutral-700">
    <span className="text-neutral-500">{label}</span>
    <span className="text-right text-neutral-900">{value}</span>
  </div>
);

const ParticipantCard = ({
  title,
  participant,
}: {
  title: string;
  participant: ChatParticipant;
}) => (
  <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
    <div className="h-12 w-12 rounded-full bg-neutral-200" />
    <div className="flex flex-1 flex-col gap-1">
      <div className="text-sm font-semibold text-neutral-900">{participant.nickname}</div>
      <div className="text-xs text-neutral-500">{title}</div>
    </div>
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
      {getUserTypeLabel(participant.user_type)}
    </span>
  </div>
);

export default function ChatDetail({ chatId, detail }: ChatDetailProps) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [status, setStatus] = useState(detail.status);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const participants: Array<{ title: string; data: ChatParticipant }> = [
    { title: '요청자', data: detail.requester },
    { title: '수신자', data: detail.receiver },
  ];
  const isClosed = useMemo(() => status === 'CLOSED', [status]);

  const handleCloseChat = async () => {
    if (isClosed || isClosing) return;
    setIsClosing(true);
    setCloseError(null);
    try {
      await closeChat({ chatId });
      setStatus('CLOSED');
      router.replace('/chat');
    } catch (error) {
      if (await handleCommonApiError(error)) {
        return;
      }
      setCloseError(error instanceof Error ? error.message : '채팅방 종료에 실패했습니다.');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f7f7] text-black"
      style={{ '--app-header-height': '64px' } as CSSProperties}
    >
      <header className="fixed top-0 left-1/2 z-10 flex h-16 w-full max-w-[600px] -translate-x-1/2 items-center bg-white px-4">
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('nav-direction', 'back');
            router.back();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
          aria-label="뒤로 가기"
        >
          <svg
            data-slot="icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 px-3 text-center text-base font-semibold text-neutral-900">
          채팅 상세
        </div>
        <div className="h-9 w-9" aria-hidden="true" />
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-[calc(96px+16px)] pt-[calc(var(--app-header-height)+16px)]">
        <section>
          <h2 className="text-sm font-semibold text-neutral-700">참여자</h2>
          <div className="mt-4 flex flex-col gap-3">
            {participants.map((participant) => (
              <ParticipantCard
                key={participant.title}
                title={participant.title}
                participant={participant.data}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-700">채팅 정보</h2>
          <div className="mt-4 flex flex-col gap-3">
            <DetailRow label="상태" value={detail.status === 'ACTIVE' ? '진행 중' : '종료'} />
            <DetailRow label="이력서 ID" value={detail.resume_id} />
            <DetailRow
              label="채용 공고"
              value={
                detail.job_post_url ? (
                  <a
                    href={detail.job_post_url}
                    className="text-sm font-semibold text-neutral-800 underline decoration-neutral-300 underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    공고 링크 열기
                  </a>
                ) : (
                  '—'
                )
              }
            />
            <DetailRow label="생성 일시" value={formatDateTime(detail.created_at)} />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[600px] -translate-x-1/2 bg-[#f7f7f7] px-6 pb-6 pt-3">
        <button
          type="button"
          onClick={handleCloseChat}
          disabled={isClosed || isClosing}
          className="w-full rounded-2xl bg-neutral-200 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-60"
        >
          {isClosed ? '채팅방 종료됨' : isClosing ? '종료 처리 중...' : '채팅방 종료하기'}
        </button>
        {closeError ? <p className="mt-2 text-center text-xs text-red-500">{closeError}</p> : null}
      </div>
    </div>
  );
}
