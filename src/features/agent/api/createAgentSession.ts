import type { AgentSession } from '@/entities/agent';
import { apiFetch } from '@/shared/api';
import { normalizeAgentSession } from './normalize';

export async function createAgentSession(): Promise<AgentSession> {
  const data = await apiFetch<unknown>('/bff/agent/sessions', { method: 'POST' });
  const normalized = normalizeAgentSession(data);
  if (!normalized) {
    throw new Error('INVALID_AGENT_SESSION_RESPONSE');
  }
  return normalized;
}
