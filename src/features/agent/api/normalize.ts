import type { AgentMessage, AgentSession, AgentSessionMessagesData } from '@/entities/agent';

export function normalizeAgentSession(raw: unknown): AgentSession | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as {
    sessionId?: unknown;
    session_id?: unknown;
    createdAt?: unknown;
    created_at?: unknown;
    messageCount?: unknown;
    message_count?: unknown;
    lastIntent?: unknown;
    last_intent?: unknown;
  };

  const sessionId =
    typeof candidate.sessionId === 'string'
      ? candidate.sessionId
      : typeof candidate.session_id === 'string'
        ? candidate.session_id
        : null;

  if (!sessionId) return null;

  return {
    sessionId,
    createdAt:
      typeof candidate.createdAt === 'string'
        ? candidate.createdAt
        : typeof candidate.created_at === 'string'
          ? candidate.created_at
          : '',
    messageCount:
      typeof candidate.messageCount === 'number'
        ? candidate.messageCount
        : typeof candidate.message_count === 'number'
          ? candidate.message_count
          : 0,
    lastIntent:
      typeof candidate.lastIntent === 'string'
        ? candidate.lastIntent
        : typeof candidate.last_intent === 'string'
          ? candidate.last_intent
          : null,
  };
}

export function normalizeAgentSessions(raw: unknown): AgentSession[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeAgentSession(item))
    .filter((item): item is AgentSession => !!item);
}

function normalizeAgentMessage(raw: unknown): AgentMessage | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as {
    id?: unknown;
    sessionId?: unknown;
    session_id?: unknown;
    role?: unknown;
    content?: unknown;
    metadata?: unknown;
    meta_data?: unknown;
    createdAt?: unknown;
    created_at?: unknown;
  };

  const id = typeof candidate.id === 'number' ? candidate.id : null;
  if (id === null) return null;

  const sessionId =
    typeof candidate.sessionId === 'string'
      ? candidate.sessionId
      : typeof candidate.session_id === 'string'
        ? candidate.session_id
        : '';

  return {
    id,
    sessionId,
    role: typeof candidate.role === 'string' ? candidate.role : 'ASSISTANT',
    content: typeof candidate.content === 'string' ? candidate.content : '',
    metadata: candidate.metadata ?? candidate.meta_data,
    createdAt:
      typeof candidate.createdAt === 'string'
        ? candidate.createdAt
        : typeof candidate.created_at === 'string'
          ? candidate.created_at
          : '',
  };
}

export function normalizeAgentSessionMessagesData(raw: unknown): AgentSessionMessagesData {
  if (!raw || typeof raw !== 'object') {
    return { messages: [] };
  }

  const candidate = raw as { messages?: unknown };
  const messages = Array.isArray(candidate.messages)
    ? candidate.messages
        .map((message) => normalizeAgentMessage(message))
        .filter((message): message is AgentMessage => !!message)
    : [];

  return { messages };
}
