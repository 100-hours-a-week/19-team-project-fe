import type { AgentReplyRequest } from '@/entities/agent';
import { buildApiUrl } from '@/shared/api';

const AGENT_REPLY_PATH = '/api/v3/agent/reply';

export async function replyAgent(payload: AgentReplyRequest, accessToken: string): Promise<Response> {
  return fetch(buildApiUrl(AGENT_REPLY_PATH), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
}
