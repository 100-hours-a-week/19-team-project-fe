'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ResumeStack({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const previousDepth = useRef<number | null>(null);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const depth = segments[0] === 'resume' ? segments.length : 0;

    if (previousDepth.current !== null) {
      setDirection(depth >= previousDepth.current ? 'forward' : 'back');
    }

    previousDepth.current = depth;
  }, [pathname]);

  return (
    <div className="onboarding-stack min-h-[100dvh]">
      <div
        key={pathname}
        className={`onboarding-stack__screen ${
          direction === 'forward'
            ? 'onboarding-stack__screen--forward'
            : 'onboarding-stack__screen--back'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
