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
