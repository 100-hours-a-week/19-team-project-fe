// shared/ws/manager.ts
import type { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { createStompClient } from './client';

export class StompConnectError extends Error {
  kind: 'stomp' | 'websocket';
  headers?: Record<string, string>;
  body?: string;

  constructor(
    kind: 'stomp' | 'websocket',
    message: string,
    options?: { headers?: Record<string, string>; body?: string },
  ) {
    super(message);
    this.name = 'StompConnectError';
    this.kind = kind;
    this.headers = options?.headers;
    this.body = options?.body;
  }
}

export type StompStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'error';

type InternalState = {
  client: Client | null;
  status: StompStatus;
  connectingPromise: Promise<void> | null;
  activeSubscriptions: Map<string, StompSubscription>;
  subscriptionDefinitions: Map<string, SubscriptionDefinition>;
};

type SubscriptionDefinition = {
  destination: string;
  handler: (payload: unknown, raw: IMessage) => void;
};

declare global {
  var __stompState: InternalState | undefined;
}

function getState(): InternalState {
  if (!globalThis.__stompState) {
    globalThis.__stompState = {
      client: null,
      status: 'idle',
      connectingPromise: null,
      activeSubscriptions: new Map(),
      subscriptionDefinitions: new Map(),
    };
  }
  return globalThis.__stompState;
}

function attachSubscription(st: InternalState, key: string, definition: SubscriptionDefinition) {
  if (!st.client || !st.client.connected) return;

  const existing = st.activeSubscriptions.get(key);
  if (existing) {
    try {
      existing.unsubscribe();
    } catch {}
    st.activeSubscriptions.delete(key);
  }

  const subscription = st.client.subscribe(definition.destination, (msg) => {
    const payload = JSON.parse(msg.body) as unknown;
    definition.handler(payload, msg);
  });
  st.activeSubscriptions.set(key, subscription);
}

function reattachAllSubscriptions(st: InternalState) {
  for (const [key, definition] of st.subscriptionDefinitions.entries()) {
    attachSubscription(st, key, definition);
  }
}

export const stompManager = {
  getStatus(): StompStatus {
    return getState().status;
  },

  isConnected(): boolean {
    const st = getState();
    return !!st.client?.connected;
  },

  async connect(
    url: string,
    options?: {
      connectHeaders?: Record<string, string>;
      getConnectHeaders?:
        | (() => Promise<Record<string, string> | undefined>)
        | (() => Record<string, string> | undefined);
    },
  ): Promise<void> {
    const st = getState();

    if (st.client?.connected) return;

    if (st.connectingPromise) return st.connectingPromise;

    // Ensure a previously failed client is fully stopped before creating a new one.
    if (st.client && !st.client.connected) {
      for (const sub of st.activeSubscriptions.values()) {
        try {
          sub.unsubscribe();
        } catch {}
      }
      st.activeSubscriptions.clear();
      try {
        await st.client.deactivate();
      } catch {}
      st.client = null;
    }

    st.status = 'connecting';

    st.connectingPromise = new Promise<void>((resolve, reject) => {
      try {
        const client = createStompClient({
          url,
          connectHeaders: options?.connectHeaders,
          getConnectHeaders: options?.getConnectHeaders,
        });
        st.client = client;

        client.onConnect = () => {
          st.status = 'connected';
          reattachAllSubscriptions(st);
          st.connectingPromise = null;
          resolve();
        };

        client.onStompError = (frame) => {
          console.error('STOMP ERROR');
          console.error('headers:', frame.headers);
          console.error('body:', frame.body);
          st.status = 'error';
          st.connectingPromise = null;
          const details = [frame.headers.message, frame.headers.code, frame.body]
            .filter((part) => typeof part === 'string' && part.length > 0)
            .join(' | ');
          reject(
            new StompConnectError('stomp', details || 'STOMP error', {
              headers: frame.headers,
              body: frame.body,
            }),
          );
        };

        client.onWebSocketError = () => {
          st.status = 'error';
          st.connectingPromise = null;
          reject(new StompConnectError('websocket', 'WebSocket error'));
        };

        client.onWebSocketClose = () => {
          if (st.status !== 'disconnecting') {
            st.status = 'disconnected';
          }
        };

        client.activate();
      } catch (e) {
        st.status = 'error';
        st.connectingPromise = null;
        reject(e);
      }
    });

    return st.connectingPromise;
  },

  async disconnect(): Promise<void> {
    const st = getState();
    if (!st.client) return;

    st.status = 'disconnecting';

    for (const sub of st.activeSubscriptions.values()) {
      try {
        sub.unsubscribe();
      } catch {}
    }
    st.activeSubscriptions.clear();
    st.subscriptionDefinitions.clear();

    try {
      await st.client.deactivate();
    } finally {
      st.client = null;
      st.connectingPromise = null;
      st.status = 'disconnected';
    }
  },

  /**
   * 구독
   * @param destination STOMP destination
   * @param handler 메시지 핸들러
   * @param key 구독 키 (중복 방지용)
   */

  subscribe<T>(
    destination: string,
    handler: (payload: T, raw: IMessage) => void,
    key: string = destination,
  ): () => void {
    const st = getState();

    if (!st.client || !st.client.connected) {
      throw new Error('STOMP is not connected');
    }

    st.subscriptionDefinitions.set(key, {
      destination,
      handler: (payload, raw) => {
        handler(payload as T, raw);
      },
    });

    attachSubscription(st, key, {
      destination,
      handler: (payload, raw) => {
        handler(payload as T, raw);
      },
    });

    return () => {
      st.subscriptionDefinitions.delete(key);
      const sub = st.activeSubscriptions.get(key);
      if (!sub) return;
      sub.unsubscribe();
      st.activeSubscriptions.delete(key);
    };
  },

  publish(destination: string, body: unknown) {
    const st = getState();

    if (!st.client || !st.client.connected) {
      throw new Error('STOMP is not connected');
    }

    st.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  },
};
