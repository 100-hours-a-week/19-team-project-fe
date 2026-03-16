export type AgentSession = {
  sessionId: string;
  createdAt: string;
  messageCount: number;
  lastIntent: string | null;
};

export type AgentMessage = {
  id: number;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | string;
  content: string;
  feedback?: boolean | null;
  metadata?: unknown;
  createdAt: string;
};

export type AgentSessionMessagesData = {
  messages: AgentMessage[];
};

export type AgentReplyRequest = {
  session_id?: string;
  message: string;
  top_k?: number;
};

export type AgentSseEventName =
  | 'session'
  | 'intent'
  | 'conditions'
  | 'cards'
  | 'text'
  | 'done'
  | 'error'
  | string;

export type AgentSseEventPayload = unknown;

export type AgentSseEvent = {
  event: AgentSseEventName;
  data: AgentSseEventPayload;
};

export type AgentMessageFeedbackRequest = {
  feedback: boolean | null;
};

export type AgentMessageFeedbackData = {
  messageId: number;
  feedback: boolean | null;
};
