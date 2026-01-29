export type ChatMessageType = 'TEXT';
export type ChatRequestType = 'FEEDBACK' | 'COFFEE_CHAT';

export interface SendChatMessageRequest {
  chat_id: number;
  content: string;
  message_type: ChatMessageType;
  client_message_id?: string;
}

export type ChatResponseCode =
  | 'CREATED'
  | 'INVALID_REQUEST'
  | 'AUTH_UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CHAT_NOT_FOUND';

export type ChatResponse<T> =
  | { code: 'CREATED'; data: T }
  | { code: 'UPDATED'; data: T }
  | { code: 'DELETED'; data: null };

export interface ChatCreatedData {
  chat_id: number;
}

export interface ChatCreateRequest {
  receiver_id: number;
  resume_id: number;
  job_post_url: string;
  request_type: ChatRequestType;
}

export interface ChatParticipant {
  user_id: number;
  nickname: string;
  profile_image_url?: string | null;
  user_type?: string;
}

export interface ChatMessageSummary {
  message_id: number;
  content: string;
  created_at: string;
}

export interface ChatSummary {
  chat_id: number;
  chatId?: number;
  requester: ChatParticipant;
  receiver: ChatParticipant;
  last_message: ChatMessageSummary | null;
  unread_count: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatListData {
  chats: ChatSummary[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface ChatMessageItem {
  message_id: number;
  chat_id: number;
  sender: ChatParticipant;
  message_type: ChatMessageType;
  content: string;
  created_at: string;
  client_message_id?: string;
}

export interface ChatMessageListData {
  messages: ChatMessageItem[];
  nextCursor: number | null;
  hasMore: boolean;
}
