import type { AgentSession } from '@/entities/agent';
import { apiFetch } from '@/shared/api';
import { normalizeAgentSession } from './normalize';

export async function getAgentSession(sessionId: string): Promise<AgentSession> {
  const data = await apiFetch<unknown>(`/bff/agent/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
  });
  const normalized = normalizeAgentSession(data);
  if (!normalized) {
    throw new Error('INVALID_AGENT_SESSION_RESPONSE');
  }
  return normalized;
}
