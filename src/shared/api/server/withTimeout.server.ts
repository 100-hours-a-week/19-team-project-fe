import 'server-only';

export class RequestTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`REQUEST_TIMEOUT_${timeoutMs}MS`);
    this.name = 'RequestTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export type WithTimeoutOptions = {
  timeoutMs: number;
  signal?: AbortSignal;
};

const hasAbortSignalAny = typeof AbortSignal !== 'undefined' && 'any' in AbortSignal;
const hasAbortSignalTimeout = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal;

function combineSignals(signals: AbortSignal[]): AbortSignal {
  if (signals.length === 1) return signals[0];

  if (hasAbortSignalAny) {
    const abortSignalAny = AbortSignal.any as (signals: AbortSignal[]) => AbortSignal;
    return abortSignalAny(signals);
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  return controller.signal;
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (hasAbortSignalTimeout) {
    const abortSignalTimeout = AbortSignal.timeout as (ms: number) => AbortSignal;
    return abortSignalTimeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error('TIMEOUT')), timeoutMs);
  return controller.signal;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError' || error.name === 'TimeoutError';
  }
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.name === 'TimeoutError';
  }
  return false;
}

export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: WithTimeoutOptions,
): Promise<T> {
  const timeoutSignal = createTimeoutSignal(options.timeoutMs);
  const signal = options.signal ? combineSignals([options.signal, timeoutSignal]) : timeoutSignal;

  try {
    return await operation(signal);
  } catch (error) {
    if (timeoutSignal.aborted && isAbortError(error)) {
      throw new RequestTimeoutError(options.timeoutMs);
    }
    throw error;
  }
}
