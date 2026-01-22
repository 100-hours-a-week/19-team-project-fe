'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

const currentUserId = 2;

const messages = [
  {
    message_id: 33,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '집 도착했어!',
    created_at: '2026-01-22 20:53:50',
  },
  {
    message_id: 34,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '오늘 회의 어땠어?',
    created_at: '2026-01-22 20:53:52',
  },
  {
    message_id: 35,
    chat_id: 1,
    sender: {
      user_id: 3,
      nickname: '하린',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '무난했지 뭐. 점심은?',
    created_at: '2026-01-22 20:53:53',
  },
  {
    message_id: 36,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '편의점 김밥으로 때웠어.',
    created_at: '2026-01-22 21:20:39',
  },
  {
    message_id: 37,
    chat_id: 1,
    sender: {
      user_id: 3,
      nickname: '하린',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '헉.. 내일은 제대로 먹자 ㅋㅋ',
    created_at: '2026-01-22 21:20:42',
  },
  {
    message_id: 38,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '좋아! 점심 뭐 먹고 싶어?',
    created_at: '2026-01-22 21:24:11',
  },
  {
    message_id: 39,
    chat_id: 1,
    sender: {
      user_id: 3,
      nickname: '하린',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '나는 쌀국수 땡김. 너는?',
    created_at: '2026-01-22 21:24:45',
  },
  {
    message_id: 40,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '오케이. 12시에 회사 앞에서 보자.',
    created_at: '2026-01-22 21:25:10',
  },
  {
    message_id: 41,
    chat_id: 1,
    sender: {
      user_id: 3,
      nickname: '하린',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '좋아! 회사 앞 신호등 쪽?',
    created_at: '2026-01-22 21:26:02',
  },
  {
    message_id: 42,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '응 거기. 그리고 오후에 커피도 한 잔 할래?',
    created_at: '2026-01-22 21:26:40',
  },
  {
    message_id: 43,
    chat_id: 1,
    sender: {
      user_id: 3,
      nickname: '하린',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '완전 좋지. 디저트 맛집 찾아볼게.',
    created_at: '2026-01-22 21:27:11',
  },
  {
    message_id: 44,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '오케이. 혹시 커피 말고 버블티는 어때?',
    created_at: '2026-01-22 21:27:55',
  },
  {
    message_id: 45,
    chat_id: 1,
    sender: {
      user_id: 3,
      nickname: '하린',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '버블티도 좋아 ㅋㅋ 요즘 딸기맛 핫하더라.',
    created_at: '2026-01-22 21:28:30',
  },
  {
    message_id: 46,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '그럼 쌀국수 먹고 버블티 가자.',
    created_at: '2026-01-22 21:29:04',
  },
  {
    message_id: 47,
    chat_id: 1,
    sender: {
      user_id: 3,
      nickname: '하린',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '굿! 내일 아침에 다시 시간 확인해줄게.',
    created_at: '2026-01-22 21:30:10',
  },
  {
    message_id: 48,
    chat_id: 1,
    sender: {
      user_id: 2,
      nickname: 'eden',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: 'ㅇㅋ. 그럼 편히 쉬어~',
    created_at: '2026-01-22 21:31:12',
  },
  {
    message_id: 49,
    chat_id: 1,
    sender: {
      user_id: 3,
      nickname: '하린',
      profile_image_url: 'https://cdn.refit.com/default-profile.png',
      user_type: 'JOB_SEEKER',
    },
    message_type: 'TEXT',
    content: '너도! 내일 보자 👋',
    created_at: '2026-01-22 21:31:44',
  },
];

const pad2 = (value: number) => value.toString().padStart(2, '0');

const formatChatTime = (value: string) => {
  const normalized = value.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const hours = parsed.getHours();
  const minutes = pad2(parsed.getMinutes());
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = pad2(hours % 12 === 0 ? 12 : hours % 12);

  return `${period} ${displayHours}:${minutes}`;
};

export default function ChatRoom() {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f7f7]">
      <header className="fixed top-0 left-1/2 z-10 flex h-app-header w-full max-w-[600px] -translate-x-1/2 items-center justify-between bg-white px-4">
        <Link href="/chat" className="text-sm text-neutral-700">
          ←
        </Link>
        <div className="text-sm font-semibold text-neutral-900">eden</div>
        <Link href="/chat/1/detail" className="text-sm text-neutral-700">
          설정
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6 pt-[calc(var(--app-header-height)+16px)]">
        {messages.map((message) => {
          const isMine = message.sender.user_id === currentUserId;

          return (
            <div
              key={message.message_id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMine
                      ? 'bg-[var(--color-primary-main)] text-white'
                      : 'bg-white text-neutral-900'
                  }`}
                >
                  {message.content}
                </div>
                <span className="text-[11px] text-neutral-400">
                  {formatChatTime(message.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
