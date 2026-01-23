import { Client } from '@stomp/stompjs';

export interface CreateStompClientOptions {
  url: string;
  reconnectDelayMs?: number;
  heartbeatIncomingMs?: number;
  heartbeatOutgoingMs?: number;
  connectHeaders?: Record<string, string>;

  debug?: boolean;
}

export function createStompClient({
  url,
  reconnectDelayMs = 5000,
  heartbeatIncomingMs = 4000,
  heartbeatOutgoingMs = 4000,
  connectHeaders,
  debug = false,
}: CreateStompClientOptions): Client {
  if (!url) {
    throw new Error('STOMP client url is required');
  }

  const client = new Client({
    brokerURL: url,
    reconnectDelay: reconnectDelayMs,
    heartbeatIncoming: heartbeatIncomingMs,
    heartbeatOutgoing: heartbeatOutgoingMs,
    connectHeaders,
  });

  // 로그는 개발 중에만
  client.debug = debug ? (msg) => console.log('[stomp]', msg) : () => {};

  return client;
}
