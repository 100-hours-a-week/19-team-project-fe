'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useToast } from '@/shared/ui/toast';

export function HomeGuardToast() {
  const params = useSearchParams();
  const router = useRouter();
  const { pushToast } = useToast();

  useEffect(() => {
    const guard = params.get('guard');
    if (guard !== 'invalid') return;
    pushToast('잘못된 접근입니다.', { variant: 'warning' });
    router.replace('/');
  }, [params, pushToast, router]);

  return null;
}
