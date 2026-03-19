import type { ChatMessageItem } from '@/entities/chat';
import { parseKstDate } from '@/shared/lib/dateTime';

export const sortMessagesByTime = (items: ChatMessageItem[]) =>
  [...items].sort((a, b) => {
    const timeA = parseKstDate(a.created_at)?.getTime() ?? Number.NaN;
    const timeB = parseKstDate(b.created_at)?.getTime() ?? Number.NaN;
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      const idA = a.message_id ?? Number.MIN_SAFE_INTEGER;
      const idB = b.message_id ?? Number.MIN_SAFE_INTEGER;
      return idA - idB;
    }
    return timeA - timeB;
  });
