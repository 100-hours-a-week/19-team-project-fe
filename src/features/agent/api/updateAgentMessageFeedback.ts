import type { AgentMessageFeedbackData, AgentMessageFeedbackRequest } from '@/entities/agent';
import { apiFetch } from '@/shared/api';

export async function updateAgentMessageFeedback(
  messageId: number,
  payload: AgentMessageFeedbackRequest,
): Promise<AgentMessageFeedbackData> {
  return apiFetch<AgentMessageFeedbackData>(
    `/bff/agent/messages/${encodeURIComponent(String(messageId))}/feedback`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
}
