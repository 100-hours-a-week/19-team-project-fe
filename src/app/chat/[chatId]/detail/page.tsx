import { ChatDetailLoader } from '@/widgets/chat';

type ChatDetailPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { chatId: rawChatId } = await params;
  const chatId = Number(rawChatId);
  if (Number.isNaN(chatId)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f7f7] text-sm text-neutral-600">
        잘못된 채팅 정보입니다.
      </div>
    );
  }

  return <ChatDetailLoader chatId={chatId} />;
}
