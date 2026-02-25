import type { ChatRequestType } from '@/entities/chat';

const normalizeRequestType = (value: unknown): ChatRequestType | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'FEEDBACK') return 'FEEDBACK';
  if (normalized === 'COFFEE_CHAT') return 'COFFEE_CHAT';
  return null;
};

export const normalizeRequestTypeFromUnknown = (item: unknown): ChatRequestType | null => {
  if (!item || typeof item !== 'object') return null;

  const raw = item as {
    request_type?: unknown;
    requestType?: unknown;
    chat_type?: unknown;
    chatType?: unknown;
    type?: unknown;
    chat_request?: {
      request_type?: unknown;
      requestType?: unknown;
      chat_type?: unknown;
      chatType?: unknown;
      type?: unknown;
    } | null;
    chatRequest?: {
      request_type?: unknown;
      requestType?: unknown;
      chat_type?: unknown;
      chatType?: unknown;
      type?: unknown;
    } | null;
    request?: {
      request_type?: unknown;
      requestType?: unknown;
      chat_type?: unknown;
      chatType?: unknown;
      type?: unknown;
    } | null;
  };

  return (
    normalizeRequestType(raw.request_type) ??
    normalizeRequestType(raw.requestType) ??
    normalizeRequestType(raw.chat_type) ??
    normalizeRequestType(raw.chatType) ??
    normalizeRequestType(raw.type) ??
    normalizeRequestType(raw.chat_request?.request_type) ??
    normalizeRequestType(raw.chat_request?.requestType) ??
    normalizeRequestType(raw.chat_request?.chat_type) ??
    normalizeRequestType(raw.chat_request?.chatType) ??
    normalizeRequestType(raw.chat_request?.type) ??
    normalizeRequestType(raw.chatRequest?.request_type) ??
    normalizeRequestType(raw.chatRequest?.requestType) ??
    normalizeRequestType(raw.chatRequest?.chat_type) ??
    normalizeRequestType(raw.chatRequest?.chatType) ??
    normalizeRequestType(raw.chatRequest?.type) ??
    normalizeRequestType(raw.request?.request_type) ??
    normalizeRequestType(raw.request?.requestType) ??
    normalizeRequestType(raw.request?.chat_type) ??
    normalizeRequestType(raw.request?.chatType) ??
    normalizeRequestType(raw.request?.type) ??
    null
  );
};
