// shared/ws/manager.ts
import type { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { createStompClient } from './client';

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
  subscriptions: Map<string, StompSubscription>;
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
      subscriptions: new Map(),
    };
  }
  return globalThis.__stompState;
}

export const stompManager = {
  getStatus(): StompStatus {
    return getState().status;
  },

  isConnected(): boolean {
    const st = getState();
    return !!st.client?.connected;
  },

  async connect(url: string, options?: { connectHeaders?: Record<string, string> }): Promise<void> {
    const st = getState();

    if (st.client?.connected) return;

    if (st.connectingPromise) return st.connectingPromise;

    st.status = 'connecting';

    st.connectingPromise = new Promise<void>((resolve, reject) => {
      try {
        const client = createStompClient({
          url,
          connectHeaders: options?.connectHeaders,
        });
        st.client = client;

        client.onConnect = () => {
          st.status = 'connected';
          st.connectingPromise = null;
          resolve();
        };

        client.onStompError = (frame) => {
          console.error('STOMP ERROR');
          console.error('headers:', frame.headers);
          console.error('body:', frame.body);
          st.status = 'error';
          st.connectingPromise = null;
          reject(new Error('STOMP error'));
        };

        client.onWebSocketError = () => {
          st.status = 'error';
          st.connectingPromise = null;
          reject(new Error('WebSocket error'));
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

    for (const sub of st.subscriptions.values()) {
      try {
        sub.unsubscribe();
      } catch {}
    }
    st.subscriptions.clear();

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

    const existing = st.subscriptions.get(key);
    if (existing) {
      existing.unsubscribe();
      st.subscriptions.delete(key);
    }

    const subscription = st.client.subscribe(destination, (msg) => {
      const payload = JSON.parse(msg.body) as T;
      handler(payload, msg);
    });

    st.subscriptions.set(key, subscription);

    return () => {
      const sub = st.subscriptions.get(key);
      if (!sub) return;
      sub.unsubscribe();
      st.subscriptions.delete(key);
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
