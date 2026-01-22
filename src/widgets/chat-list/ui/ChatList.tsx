const chats = [
  {
    id: 1,
    name: 'eden',
    lastMessage: 'ㅋㅋㅋㅎㅇㅎㅇㅎㅇ',
    time: '오후 4:14',
    unread: 0,
  },
  {
    id: 2,
    name: '가족 4',
    lastMessage: '굳굳',
    time: '어제',
    unread: 12,
  },
  {
    id: 3,
    name: '카카오톡 지갑',
    lastMessage: '인증이 완료되었습니다.',
    time: '어제',
    unread: 8,
  },
  {
    id: 4,
    name: '박준서',
    lastMessage: '사진을 보냈습니다.',
    time: '어제',
    unread: 0,
  },
  {
    id: 5,
    name: '카카오계정',
    lastMessage: '카카오계정 로그인 알림',
    time: '어제',
    unread: 0,
  },
  {
    id: 6,
    name: '카카오',
    lastMessage: '(동영상 광고) 나를 닮은 쪼르디는 어떤 모습일까?',
    time: '어제',
    unread: 9,
  },
];

export default function ChatList() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-black text-white">
      <div className="px-6 pt-8">
        <h1 className="text-2xl font-semibold">채팅</h1>
      </div>

      <section className="px-6 pt-6">
        <div className="flex items-center justify-between rounded-3xl bg-white px-6 py-5 text-black">
          <div>
            <p className="text-lg font-semibold">[마감 임박] 탈잉 80% 할인</p>
            <p className="mt-2 text-sm text-neutral-500">마지막 기회 놓치지 마세요!</p>
          </div>
          <div className="h-20 w-20 rounded-2xl bg-neutral-200" />
        </div>
      </section>

      <ul className="mt-4 flex flex-1 flex-col gap-1 px-2 pb-[calc(var(--app-footer-height)+16px)]">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-white/5"
            >
              <div className="h-12 w-12 flex-shrink-0 rounded-full bg-neutral-700" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold">{chat.name}</div>
                <div className="mt-1 truncate text-sm text-neutral-400">{chat.lastMessage}</div>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs text-neutral-400">
                <span>{chat.time}</span>
                {chat.unread > 0 ? (
                  <span className="rounded-full bg-orange-500 px-2 py-1 text-[11px] font-semibold text-white">
                    {chat.unread}
                  </span>
                ) : null}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
