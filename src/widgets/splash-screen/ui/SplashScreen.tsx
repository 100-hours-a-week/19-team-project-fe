'use client';

import Lanyard from './Lanyard';

export default function SplashScreen() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <Lanyard position={[0, 0, 20]} gravity={[0, -65, 0]} />
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(53, 85, 139, 0.35) 0%, rgba(53, 85, 139, 0.12) 45%, rgba(53, 85, 139, 0.32) 100%)',
          }}
        />
        <div className="absolute left-6 top-8 flex flex-col gap-3 text-white md:left-10 md:top-10">
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-white/70">Re:Fit</p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            나에게 딱 맞는 코칭을
            <br />
            준비하고 있어요
          </h1>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>로딩 중</span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70 [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
