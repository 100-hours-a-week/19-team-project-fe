import type { AgentSessionMessagesData } from '@/entities/agent';
import { apiFetchWithRefresh } from '@/shared/api/server';
import { buildApiUrl } from '@/shared/api';

const AGENT_SESSIONS_PATH = '/api/v3/agent/sessions';

export async function getAgentSessionMessages(
  sessionId: string,
  accessToken?: string,
): Promise<AgentSessionMessagesData> {
  return apiFetchWithRefresh<AgentSessionMessagesData>(
    buildApiUrl(`${AGENT_SESSIONS_PATH}/${encodeURIComponent(sessionId)}/messages`),
    { method: 'GET' },
    accessToken,
  );
}
