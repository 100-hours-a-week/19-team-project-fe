'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type OnboardingLayoutProps = {
  children: ReactNode;
};

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const step = useMemo(() => {
    if (!pathname) return 0;
    return pathname.includes('/onboarding/profile') ? 1 : 0;
  }, [pathname]);

  const prevStepRef = useRef(step);
  const direction =
    step === prevStepRef.current ? 'none' : step > prevStepRef.current ? 'forward' : 'back';

  useEffect(() => {
    prevStepRef.current = step;
  }, [step]);

  const key = `${pathname}?${searchParams?.toString() ?? ''}`;

  return (
    <div className="onboarding-stack">
      <div
        key={key}
        className={`onboarding-stack__screen ${
          direction === 'none' ? '' : `onboarding-stack__screen--${direction}`
        }`}
      >
        {children}
      </div>
    </div>
  );
}
