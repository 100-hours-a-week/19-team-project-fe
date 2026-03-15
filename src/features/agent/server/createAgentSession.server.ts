import type { AgentSession } from '@/entities/agent';
import { apiFetchWithRefresh } from '@/shared/api/server';
import { buildApiUrl } from '@/shared/api';

const AGENT_SESSIONS_PATH = '/api/v3/agent/sessions';

export async function createAgentSession(accessToken?: string): Promise<AgentSession> {
  return apiFetchWithRefresh<AgentSession>(
    buildApiUrl(AGENT_SESSIONS_PATH),
    { method: 'POST' },
    accessToken,
  );
}
