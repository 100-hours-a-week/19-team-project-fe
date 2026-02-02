import { redirect } from 'next/navigation';

import ChatDetailClient from './ChatDetailClient';

type ChatDetailPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { chatId: rawChatId } = await params;
  const chatId = Number(rawChatId);
  if (Number.isNaN(chatId)) {
    redirect('/chat');
  }
  return <ChatDetailClient chatId={chatId} />;
}
