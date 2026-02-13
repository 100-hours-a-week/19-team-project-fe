import { Suspense } from 'react';

import { ChatList } from '@/widgets/chat';
import { Footer } from '@/widgets/footer';

export default function ChatPage() {
  return (
    <>
      <Suspense fallback={null}>
        <ChatList />
      </Suspense>
      <Footer />
    </>
  );
}
