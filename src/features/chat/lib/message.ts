import type { ChatMessageItem } from '@/entities/chat';

export const sortMessagesByTime = (items: ChatMessageItem[]) =>
  [...items].sort((a, b) => {
    const timeA = new Date(a.created_at.replace(' ', 'T')).getTime();
    const timeB = new Date(b.created_at.replace(' ', 'T')).getTime();
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return a.message_id - b.message_id;
    }
    return timeA - timeB;
  });
