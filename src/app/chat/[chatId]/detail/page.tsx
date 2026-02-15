import { ChatDetailLoader } from '@/widgets/chat';
import type { ChatRequestType } from '@/entities/chat';

type ChatDetailPageProps = {
  params: Promise<{
    chatId: string;
  }>;
  searchParams: Promise<{
    requestType?: string;
  }>;
};

export default async function ChatDetailPage({ params, searchParams }: ChatDetailPageProps) {
  const { chatId: rawChatId } = await params;
  const { requestType } = await searchParams;
  const chatId = Number(rawChatId);
  if (Number.isNaN(chatId)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f7f7] text-sm text-neutral-600">
        잘못된 채팅 정보입니다.
      </div>
    );
  }

  const normalizedRequestType: ChatRequestType | null =
    requestType === 'FEEDBACK' || requestType === 'COFFEE_CHAT' ? requestType : null;

  return <ChatDetailLoader chatId={chatId} requestType={normalizedRequestType} />;
}
