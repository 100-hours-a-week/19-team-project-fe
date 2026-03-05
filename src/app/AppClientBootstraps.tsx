'use client';

import { FcmBootstrap } from '@/features/notification-fcm';
import { MetricsInitializer } from '@/shared/metrics/MetricsInitializer';
import { GaPageView } from '@/shared/metrics/GaPageView';
import { ServiceWorkerRegistrar } from '@/shared/lib/pwa';

export default function AppClientBootstraps() {
  return (
    <>
      <ServiceWorkerRegistrar />
      <MetricsInitializer />
      <GaPageView />
      <FcmBootstrap />
    </>
  );
}

