'use client';

import * as Sentry from '@sentry/nextjs';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/toast';

async function flushSentry() {
  await Sentry.flush(2_000);
}

export default function SentryTestPanel() {
  const { pushToast } = useToast();

  const sendMessageEvent = async () => {
    const eventId = Sentry.captureMessage('Sentry test message from /sentry-test page', 'info');
    await flushSentry();
    pushToast(`메시지 이벤트 전송 완료: ${eventId}`, { variant: 'success' });
  };

  const sendExceptionEvent = async () => {
    const error = new Error('Sentry test exception from /sentry-test page');
    const eventId = Sentry.captureException(error);
    await flushSentry();
    pushToast(`예외 이벤트 전송 완료: ${eventId}`, { variant: 'success' });
  };

  return (
    <section className="mx-auto w-full max-w-[520px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900">Sentry Event Test</h1>
      <p className="mt-2 text-sm text-gray-600">
        아래 버튼으로 실제 Sentry 이벤트를 전송해 대시보드에서 수신 여부를 확인하세요.
      </p>
      <div className="mt-4">
        <Button type="button" onClick={sendMessageEvent}>
          메시지 이벤트 전송
        </Button>
        <Button type="button" variant="secondary" onClick={sendExceptionEvent}>
          예외 이벤트 전송
        </Button>
      </div>
    </section>
  );
}
