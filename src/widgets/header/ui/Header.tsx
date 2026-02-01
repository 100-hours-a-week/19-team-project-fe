import Image from 'next/image';

import logoHeader from '@/shared/icons/logo_header.png';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-app-header w-full items-center justify-between bg-white px-2.5">
      <Image src={logoHeader} alt="re-fit" className="h-7 w-auto" priority />
      <div />
    </header>
  );
}
