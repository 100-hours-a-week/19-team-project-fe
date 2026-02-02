import { redirect } from 'next/navigation';

import { ChatRoom } from '@/widgets/chat-room';

type ChatRoomPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { chatId: rawChatId } = await params;
  const chatId = Number(rawChatId);
  if (Number.isNaN(chatId)) {
    redirect('/?guard=invalid');
  }
  return <ChatRoom chatId={chatId} />;
}
