import type { ChatMessageItem } from '@/entities/chat';
import { parseKstDate } from '@/shared/lib/dateTime';

export const sortMessagesByTime = (items: ChatMessageItem[]) =>
  [...items].sort((a, b) => {
    const timeA = parseKstDate(a.created_at)?.getTime() ?? Number.NaN;
    const timeB = parseKstDate(b.created_at)?.getTime() ?? Number.NaN;
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return a.message_id - b.message_id;
    }
    return timeA - timeB;
  });
