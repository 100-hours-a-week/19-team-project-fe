import Link from 'next/link';

const participants = [
  { id: 1, name: 'eden' },
  { id: 2, name: '하린' },
  { id: 3, name: '도윤' },
  { id: 4, name: '지수' },
];

export default function ChatDetail() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f7f7] text-black">
      <header className="fixed top-0 left-1/2 z-10 flex h-app-header w-full max-w-[600px] -translate-x-1/2 items-center justify-between bg-white px-4">
        <Link href="/chat/1" className="text-sm text-neutral-700">
          ←
        </Link>
        <div className="text-sm font-semibold text-neutral-900">채팅 상세</div>
        <div className="w-6" />
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-[calc(96px+16px)] pt-[calc(var(--app-header-height)+16px)]">
        <section>
          <h2 className="text-sm font-semibold text-neutral-700">참여자</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {participants.map((participant) => (
              <div key={participant.id} className="flex flex-col items-center gap-2">
                <div className="h-14 w-14 rounded-full bg-neutral-200" />
                <span className="text-xs text-neutral-600">{participant.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[600px] -translate-x-1/2 bg-[#f7f7f7] px-6 pb-6 pt-3">
        <button
          type="button"
          className="w-full rounded-2xl bg-neutral-200 py-3 text-sm font-semibold text-neutral-700"
        >
          채팅방 종료하기
        </button>
      </div>
    </div>
  );
}
