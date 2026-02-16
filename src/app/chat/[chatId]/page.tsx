import { redirect } from 'next/navigation';

import { ChatRoom } from '@/widgets/chat';
import type { ChatRequestType } from '@/entities/chat';

type ChatRoomPageProps = {
  params: Promise<{
    chatId: string;
  }>;
  searchParams: Promise<{
    requestType?: string;
  }>;
};

export default async function ChatRoomPage({ params, searchParams }: ChatRoomPageProps) {
  const { chatId: rawChatId } = await params;
  const { requestType } = await searchParams;
  const chatId = Number(rawChatId);
  if (Number.isNaN(chatId)) {
    redirect('/?guard=invalid');
  }

  const normalizedRequestType: ChatRequestType | null =
    requestType === 'FEEDBACK' || requestType === 'COFFEE_CHAT' ? requestType : null;

  return <ChatRoom chatId={chatId} requestType={normalizedRequestType} />;
}
