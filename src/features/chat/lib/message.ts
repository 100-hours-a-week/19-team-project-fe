import type { ChatMessageItem } from '@/entities/chat';
import { parseServerDate } from '@/shared/lib/date';

export const sortMessagesByTime = (items: ChatMessageItem[]) =>
  [...items].sort((a, b) => {
    const timeA = parseServerDate(a.created_at)?.getTime() ?? Number.NaN;
    const timeB = parseServerDate(b.created_at)?.getTime() ?? Number.NaN;
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return a.message_id - b.message_id;
    }
    return timeA - timeB;
  });
