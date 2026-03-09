'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './ReportStack.module.css';

export default function ReportStack({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [direction, setDirection] = useState<'forward' | 'back' | 'none'>('none');
  const previousDepth = useRef<number | null>(null);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const depth = segments[0] === 'report' ? segments.length : 0;

    if (previousDepth.current !== null) {
      setDirection(depth >= previousDepth.current ? 'forward' : 'back');
    }

    previousDepth.current = depth;
  }, [pathname]);

  return (
    <div className={`${styles.stack} min-h-[100dvh]`}>
      <div
        key={pathname}
        className={`${styles.screen} ${
          direction === 'none' ? '' : direction === 'forward' ? styles.forward : styles.back
        }`}
      >
        {children}
      </div>
    </div>
  );
}
