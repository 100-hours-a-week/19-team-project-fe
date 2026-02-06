'use client';

import { useCallback } from 'react';

import { sendChatMessage, sortMessagesByTime } from '@/features/chat';
import type { ChatMessageItem } from '@/entities/chat';

const createClientMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

type UseChatSendParams = {
  chatId: number;
  chatStatus: 'ACTIVE' | 'CLOSED';
  currentUserId: number | null;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>;
};

export function useChatSend({ chatId, chatStatus, currentUserId, setMessages }: UseChatSendParams) {
  const sendOptimisticMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (chatStatus === 'CLOSED') return;

      const now = new Date();
      const optimisticId = -now.getTime();
      const clientMessageId = createClientMessageId();
      const optimistic: ChatMessageItem = {
        message_id: optimisticId,
        chat_id: chatId,
        sender: {
          user_id: currentUserId ?? 0,
          nickname: 'me',
        },
        message_type: 'TEXT',
        content: trimmed,
        created_at: now.toISOString(),
        client_message_id: clientMessageId,
      };
      setMessages((prev) => sortMessagesByTime([...prev, optimistic]));

      try {
        await sendChatMessage({
          chat_id: chatId,
          content: trimmed,
          message_type: 'TEXT',
          client_message_id: clientMessageId,
        });
      } catch (sendError) {
        setMessages((prev) => prev.filter((item) => item.message_id !== optimisticId));
        console.warn('Send message failed:', sendError);
      }
    },
    [chatId, chatStatus, currentUserId, setMessages],
  );

  return { sendOptimisticMessage };
}
