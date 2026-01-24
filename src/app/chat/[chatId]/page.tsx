import { ChatRoom } from '@/widgets/chat-room';

type ChatRoomPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { chatId: rawChatId } = await params;
  const chatId = Number(rawChatId);
  if (Number.isNaN(chatId)) return null;
  return <ChatRoom chatId={chatId} />;
}
