import type { AgentSession } from '@/entities/agent';
import { apiFetch } from '@/shared/api';
import { normalizeAgentSessions } from './normalize';

export async function getAgentSessions(): Promise<AgentSession[]> {
  const data = await apiFetch<unknown>('/bff/agent/sessions', { method: 'GET' });
  return normalizeAgentSessions(data);
}
