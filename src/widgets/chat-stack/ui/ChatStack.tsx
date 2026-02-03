'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ChatStack({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const previousDepth = useRef<number | null>(null);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const depth = segments[0] === 'chat' ? segments.length : 0;

    if (previousDepth.current !== null) {
      setDirection(depth >= previousDepth.current ? 'forward' : 'back');
    }

    previousDepth.current = depth;
  }, [pathname]);

  return (
    <div className="onboarding-stack h-full w-full">
      <div
        key={pathname}
        className={`onboarding-stack__screen h-full ${
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
