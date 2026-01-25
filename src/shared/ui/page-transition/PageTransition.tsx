'use client';

import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

type Direction = 'forward' | 'back';

const STORAGE_KEY = 'nav-direction';

export default function PageTransition({ children }: PropsWithChildren) {
  const [direction, setDirection] = useState<Direction | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'forward' || stored === 'back') {
      setDirection(stored);
    }
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const className =
    direction === 'forward'
      ? 'page-enter-from-right'
      : direction === 'back'
        ? 'page-enter-from-left'
        : '';

  return <div className={className}>{children}</div>;
}
