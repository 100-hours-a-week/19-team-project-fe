'use client';

import { useRouter } from 'next/navigation';

export default function ExpertDetailHeader() {
  useRouter();

  return (
    <header className="sticky top-0 z-10 flex h-app-header w-full items-center bg-white/90 px-2.5" />
  );
}
