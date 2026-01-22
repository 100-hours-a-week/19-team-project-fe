const chats = [
  {
    chat_id: 1,
    requester: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    receiver: {
      user_id: 3,
      nickname: 'daniel',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    last_message: {
      message_id: 14,
      content: 'ㅋㅋㅋㅎㅇㅎㅇㅎㅇ',
      created_at: '2026-01-22 16:14:34',
    },
    unread_count: 0,
    status: 'ACTIVE',
    created_at: '2026-01-22 15:36:44',
    updated_at: '2026-01-22 16:14:34',
  },
  {
    chat_id: 2,
    requester: {
      user_id: 7,
      nickname: 'kobe',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    receiver: {
      user_id: 9,
      nickname: 'chloe',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    last_message: {
      message_id: 21,
      content: '굳굳',
      created_at: '2026-01-21 10:22:01',
    },
    unread_count: 12,
    status: 'ACTIVE',
    created_at: '2026-01-21 09:44:20',
    updated_at: '2026-01-21 10:22:01',
  },
  {
    chat_id: 3,
    requester: {
      user_id: 10,
      nickname: 'bella',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    receiver: {
      user_id: 11,
      nickname: 're-fit',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    last_message: {
      message_id: 30,
      content: '인증이 완료되었습니다.',
      created_at: '2026-01-21 08:01:35',
    },
    unread_count: 8,
    status: 'ACTIVE',
    created_at: '2026-01-20 18:20:00',
    updated_at: '2026-01-21 08:01:35',
  },
  {
    chat_id: 4,
    requester: {
      user_id: 12,
      nickname: 'juncci',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    receiver: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    last_message: {
      message_id: 42,
      content: '사진을 보냈습니다.',
      created_at: '2026-01-20 19:33:48',
    },
    unread_count: 0,
    status: 'ACTIVE',
    created_at: '2026-01-20 17:05:48',
    updated_at: '2026-01-20 19:33:48',
  },
  {
    chat_id: 5,
    requester: {
      user_id: 13,
      nickname: '카카오계정',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    receiver: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    last_message: {
      message_id: 50,
      content: '카카오계정 로그인 알림',
      created_at: '2026-01-20 15:01:12',
    },
    unread_count: 0,
    status: 'ACTIVE',
    created_at: '2026-01-19 22:05:30',
    updated_at: '2026-01-20 15:01:12',
  },
  {
    chat_id: 6,
    requester: {
      user_id: 14,
      nickname: '카카오',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    receiver: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: '...',
      user_type: 'JOB_SEEKER',
    },
    last_message: {
      message_id: 62,
      content: '...',
      created_at: '2026-01-20 11:10:03',
    },
    unread_count: 9,
    status: 'ACTIVE',
    created_at: '2026-01-19 08:05:30',
    updated_at: '2026-01-20 11:10:03',
  },
];

const pad2 = (value: number) => value.toString().padStart(2, '0');

const formatChatTime = (value: string) => {
  const normalized = value.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const now = new Date();
  const isToday =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  if (!isToday) {
    return `${parsed.getFullYear()}.${pad2(parsed.getMonth() + 1)}.${pad2(parsed.getDate())}`;
  }

  const hours = parsed.getHours();
  const minutes = pad2(parsed.getMinutes());
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = pad2(hours % 12 === 0 ? 12 : hours % 12);

  return `${period} ${displayHours}:${minutes}`;
};

export default function ChatList() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-black">
      <div className="px-6 pt-8">
        <h1 className="text-2xl font-semibold">채팅</h1>
      </div>

      <section className="px-6 pt-6">
        <div className="flex items-center justify-between rounded-3xl bg-neutral-100 px-6 py-5 text-black">
          <div>
            <p className="text-lg font-semibold">[채팅 소개] 간단한 채팅 소개</p>
            <p className="mt-2 text-sm text-neutral-500">쌈뽕한 멘트 추가</p>
          </div>
          <div className="h-20 w-20 rounded-2xl bg-neutral-200" />
        </div>
      </section>

      <ul className="mt-4 flex flex-1 flex-col gap-1 px-2 pb-[calc(var(--app-footer-height)+16px)]">
        {chats.map((chat) => (
          <li key={chat.chat_id}>
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-neutral-100"
            >
              <div className="h-12 w-12 flex-shrink-0 rounded-full bg-neutral-200" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold">{chat.requester.nickname}</div>
                <div className="mt-1 truncate text-sm text-neutral-500">
                  {chat.last_message.content}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs text-neutral-400">
                <span>{formatChatTime(chat.last_message.created_at)}</span>
                {chat.unread_count > 0 ? (
                  <span className="rounded-full bg-orange-500 px-2 py-1 text-[11px] font-semibold text-white">
                    {chat.unread_count}
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
