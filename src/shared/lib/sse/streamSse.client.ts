export type SseEvent = {
  event: string;
  data: string;
};

type ConsumeSseStreamOptions = {
  signal?: AbortSignal;
  onEvent: (event: SseEvent) => void;
};

export function parseSseBlock(block: string): SseEvent | null {
  const lines = block.replace(/\r\n/g, '\n').split('\n');
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim() || 'message';
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}

export async function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  options: ConsumeSseStreamOptions,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (!options.signal?.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const event = parseSseBlock(block);
        if (event) options.onEvent(event);
      }
    }

    const tail = buffer.trim();
    if (tail) {
      const event = parseSseBlock(tail);
      if (event) options.onEvent(event);
    }
  } finally {
    reader.releaseLock();
  }
}
