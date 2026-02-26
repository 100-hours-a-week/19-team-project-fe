'use client';

import dynamic from 'next/dynamic';

const SignupConfetti = dynamic(() => import('./SignupConfetti'), { ssr: false });
const HomeGuardToast = dynamic(() => import('./HomeGuardToast').then((mod) => mod.HomeGuardToast), {
  ssr: false,
});

export default function HomeDeferredEffects() {
  return (
    <>
      <SignupConfetti />
      <HomeGuardToast />
    </>
  );
}
