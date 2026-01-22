'use client';

import type { ReactNode } from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type OnboardingLayoutProps = {
  children: ReactNode;
};

function OnboardingLayoutInner({ children }: OnboardingLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const step = useMemo(() => {
    if (!pathname) return 0;
    return pathname.includes('/onboarding/profile') ? 1 : 0;
  }, [pathname]);

  const [prevStep, setPrevStep] = useState(step);
  const [direction, setDirection] = useState<'none' | 'forward' | 'back'>('none');

  useEffect(() => {
    setDirection(step === prevStep ? 'none' : step > prevStep ? 'forward' : 'back');
    setPrevStep(step);
  }, [prevStep, step]);

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

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="onboarding-stack">
          <div className="onboarding-stack__screen">{children}</div>
        </div>
      }
    >
      <OnboardingLayoutInner>{children}</OnboardingLayoutInner>
    </Suspense>
  );
}
