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
  resume_id: number | null;
  job_post_url: string | null;
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
  last_message_at?: string;
  sender?: ChatParticipant;
  sender_id?: number;
  senderId?: number;
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

export interface ChatDetailData {
  chat_id: number;
  requester: ChatParticipant;
  receiver: ChatParticipant;
  resume_id: number;
  resume?: {
    resumeId?: number;
    resume_id?: number;
    title?: string;
    isFresher?: boolean;
    is_fresher?: boolean;
    educationLevel?: string;
    education_level?: string;
    fileUrl?: string;
    file_url?: string;
    contentJson?: Record<string, unknown> | null;
    content_json?: Record<string, unknown> | null;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
  } | null;
  job_post_url: string;
  status: 'ACTIVE' | 'CLOSED';
  created_at: string;
  closed_at: string | null;
}

export interface ChatMessageListData {
  messages: ChatMessageItem[];
  nextCursor: number | null;
  hasMore: boolean;
}
