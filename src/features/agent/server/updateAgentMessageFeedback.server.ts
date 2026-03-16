import type { AgentMessageFeedbackData, AgentMessageFeedbackRequest } from '@/entities/agent';
import { apiFetchWithRefresh } from '@/shared/api/server';
import { buildApiUrl } from '@/shared/api';

const AGENT_MESSAGE_FEEDBACK_PATH = '/api/v3/agent/messages';

export async function updateAgentMessageFeedback(
  messageId: number,
  payload: AgentMessageFeedbackRequest,
  accessToken?: string,
): Promise<AgentMessageFeedbackData> {
  return apiFetchWithRefresh<AgentMessageFeedbackData>(
    buildApiUrl(`${AGENT_MESSAGE_FEEDBACK_PATH}/${messageId}/feedback`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}
