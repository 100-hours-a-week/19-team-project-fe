import { redirect } from 'next/navigation';

import ChatRoomClient from './ChatRoomClient';

type ChatRoomPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { chatId: rawChatId } = await params;
  const chatId = Number(rawChatId);
  if (Number.isNaN(chatId)) {
    redirect('/chat');
  }
  return <ChatRoomClient chatId={chatId} />;
}
