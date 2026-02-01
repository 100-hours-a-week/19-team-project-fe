import { redirect } from 'next/navigation';

import { ChatRoom } from '@/widgets/chat-room';
import { getChatDetail } from '@/features/chat.server';

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
  try {
    await getChatDetail({ chatId });
  } catch {
    redirect('/?guard=invalid');
  }
  return <ChatRoom chatId={chatId} />;
}
