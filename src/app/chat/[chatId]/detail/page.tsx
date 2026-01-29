import { getChatDetail } from '@/features/chat.server';
import { ChatDetail } from '@/widgets/chat-detail';

type ChatDetailPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { chatId: rawChatId } = await params;
  const chatId = Number(rawChatId);
  if (Number.isNaN(chatId)) return null;

  const detail = await getChatDetail({ chatId });
  return <ChatDetail chatId={chatId} detail={detail} />;
}
