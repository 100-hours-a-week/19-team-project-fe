'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ChatRoom } from '@/widgets/chat-room';

type ChatRoomClientProps = {
  chatId: number;
};

export default function ChatRoomClient({ chatId }: ChatRoomClientProps) {
  const router = useRouter();

  useEffect(() => {
    if (!chatId || Number.isNaN(chatId)) {
      router.replace('/chat');
    }
  }, [chatId, router]);

  if (!chatId || Number.isNaN(chatId)) return null;
  return <ChatRoom chatId={chatId} />;
}
