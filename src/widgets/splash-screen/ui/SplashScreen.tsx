'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Lanyard = dynamic(() => import('./Lanyard'), { ssr: false });
type BlurTextComponent = typeof import('@/shared/ui/blur-text').BlurText;

export default function SplashScreen() {
  const [BlurText, setBlurText] = useState<BlurTextComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('@/shared/ui/blur-text').then((mod) => {
      if (!cancelled) setBlurText(() => mod.BlurText);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <Lanyard position={[0, 0, 20]} gravity={[0, -65, 0]} />
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(53, 85, 139, 0.12) 45%, rgba(53, 85, 139, 0.32) 100%)',
          }}
        />
        <div className="absolute left-6 top-8 flex flex-col gap-1 text-black md:left-10 md:top-10">
          <p className="text-2xl font-medium tracking-[0.3em] uppercase text-black">Re:Fit</p>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            {BlurText ? (
              <>
                <BlurText
                  as="span"
                  inline
                  text="대화 한 번으로,"
                  animateBy="words"
                  direction="top"
                />
                <br />
                <BlurText
                  as="span"
                  inline
                  text="당신의 Fit이 달라집니다."
                  animateBy="words"
                  direction="top"
                />
              </>
            ) : (
              <>
                대화 한 번으로,
                <br />
                당신의 Fit이 달라집니다.
              </>
            )}
          </h1>
        </div>
      </div>
    </section>
  );
}
