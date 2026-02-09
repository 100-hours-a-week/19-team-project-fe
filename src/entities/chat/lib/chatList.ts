import type { ChatListData, ChatSummary } from '@/entities/chat';

const getChatSortKey = (chat: ChatSummary) => {
  const lastMessageAt = chat.last_message?.last_message_at ?? null;
  const updatedAt = chat.updated_at ?? null;
  const raw = lastMessageAt ?? updatedAt ?? null;
  if (!raw) return 0;
  const parsed = new Date(raw.replace(' ', 'T')).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeChatId = (chat: ChatSummary): ChatSummary | null => {
  const rawChatId = chat.chat_id ?? chat.chatId ?? null;
  const parsedChatId = typeof rawChatId === 'string' ? Number(rawChatId) : rawChatId;
  const chatId =
    typeof parsedChatId === 'number' && !Number.isNaN(parsedChatId) ? parsedChatId : null;

  if (chatId === null) return null;
  return {
    ...chat,
    chat_id: chatId,
  };
};

export const normalizeChatList = (data: ChatListData): ChatSummary[] =>
  data.chats
    .map((chat) => normalizeChatId(chat))
    .filter((chat): chat is ChatSummary => !!chat)
    .sort((a, b) => getChatSortKey(b) - getChatSortKey(a));
