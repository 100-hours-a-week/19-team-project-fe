export const CHAT_REALTIME_REFRESH_EVENT = 'chat-realtime-refresh';
export const CHAT_LIST_REFRESH_EVENT = 'chat-list-refresh';

export type ChatRealtimeRefreshPayload = {
  chatId: number;
  messageId?: number;
  eventType?: string;
};

type ChatEventLike = {
  chat_id?: unknown;
  chatId?: unknown;
  message_id?: unknown;
  messageId?: unknown;
  type?: unknown;
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function parseChatRealtimePayload(raw: unknown): ChatRealtimeRefreshPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const event = raw as ChatEventLike;
  const chatId = toNumber(event.chat_id ?? event.chatId);
  if (chatId === null) return null;

  const messageId = toNumber(event.message_id ?? event.messageId) ?? undefined;
  const eventType = typeof event.type === 'string' ? event.type : undefined;
  return { chatId, messageId, eventType };
}
