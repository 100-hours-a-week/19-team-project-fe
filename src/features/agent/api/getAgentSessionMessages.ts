import type { AgentSessionMessagesData } from '@/entities/agent';
import { apiFetch } from '@/shared/api';
import { normalizeAgentSessionMessagesData } from './normalize';

export async function getAgentSessionMessages(sessionId: string): Promise<AgentSessionMessagesData> {
  const data = await apiFetch<unknown>(
    `/bff/agent/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: 'GET',
    },
  );
  return normalizeAgentSessionMessagesData(data);
}
