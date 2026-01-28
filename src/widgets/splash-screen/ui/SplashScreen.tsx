'use client';

import { BlurText } from '@/shared/ui/blur-text';
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
              'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(53, 85, 139, 0.12) 45%, rgba(53, 85, 139, 0.32) 100%)',
          }}
        />
        <div className="absolute left-6 top-8 flex flex-col gap-1 text-black md:left-10 md:top-10">
          <p className="text-2xl font-medium tracking-[0.3em] uppercase text-black">Re:Fit</p>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            <BlurText as="span" inline text="대화 한 번으로," animateBy="words" direction="top" />
            <br />
            <BlurText
              as="span"
              inline
              text="당신의 Fit이 달라집니다."
              animateBy="words"
              direction="top"
            />
          </h1>
        </div>
      </div>
    </section>
  );
}
