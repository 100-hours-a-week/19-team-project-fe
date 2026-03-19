import type { AgentReplyRequest, AgentSseEvent } from '@/entities/agent';
import { consumeSseStream } from '@/shared/lib/sse';

type StreamAgentReplyOptions = {
  signal?: AbortSignal;
  onEvent?: (event: AgentSseEvent) => void;
};

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function streamAgentReply(
  payload: AgentReplyRequest,
  options?: StreamAgentReplyOptions,
): Promise<void> {
  const res = await fetch('/bff/agent/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    credentials: 'include',
    signal: options?.signal,
  });

  if (!res.ok) {
    let message = `AGENT_REPLY_FAILED_${res.status}`;
    try {
      const body = (await res.json()) as { message?: unknown };
      if (typeof body.message === 'string' && body.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error('AGENT_REPLY_STREAM_EMPTY');
  }

  await consumeSseStream(res.body, {
    signal: options?.signal,
    onEvent: ({ event, data }) => {
      options?.onEvent?.({
        event,
        data: tryParseJson(data),
      });
    },
  });
}
