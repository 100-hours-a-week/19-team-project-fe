export type ChatMessageType = 'TEXT';

export interface SendChatMessageRequest {
  chat_id: number;
  content: string;
  message_type: ChatMessageType;
}

export type ChatResponseCode =
  | 'CREATED'
  | 'INVALID_REQUEST'
  | 'AUTH_UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CHAT_NOT_FOUND';

export interface ChatResponse<T = unknown> {
  code: ChatResponseCode;
  message: string;
  data: T | null;
}

export interface ChatCreatedData {
  chat_id: number;
}
