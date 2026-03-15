import type { AgentReplyRequest, AgentSseEvent } from '@/entities/agent';

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

function parseSseBlock(block: string): AgentSseEvent | null {
  const normalized = block.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim() || 'message';
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return {
    event,
    data: tryParseJson(dataLines.join('\n')),
  };
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

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (!event) continue;
      options?.onEvent?.(event);
    }
  }

  const tail = buffer.trim();
  if (tail) {
    const event = parseSseBlock(tail);
    if (event) options?.onEvent?.(event);
  }
}
