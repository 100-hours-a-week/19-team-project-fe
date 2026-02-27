import { Suspense } from 'react';

import { Footer } from '@/widgets/footer';
import ChatListClient from './ChatListClient';

export default function ChatPage() {
  return (
    <>
      <Suspense fallback={null}>
        <ChatListClient />
      </Suspense>
      <Footer />
    </>
  );
}
