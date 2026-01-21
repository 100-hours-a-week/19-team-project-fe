import Image from 'next/image';

import logo from '@/shared/icons/Logo.png';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-app-header w-full items-center justify-between bg-white/80 px-6">
      <Image src={logo} alt="re-fit" width={64} height={16} priority />
      <div />
    </header>
  );
}
