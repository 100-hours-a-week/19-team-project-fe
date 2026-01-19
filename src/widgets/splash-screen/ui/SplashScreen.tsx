'use client';

import Lanyard from './Lanyard';

export default function SplashScreen() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
    </section>
  );
}
