'use client';

import { HomeGuardToast } from './HomeGuardToast';
import SignupConfetti from './SignupConfetti';

export default function HomeDeferredEffects() {
  return (
    <>
      <HomeGuardToast />
      <SignupConfetti />
    </>
  );
}
