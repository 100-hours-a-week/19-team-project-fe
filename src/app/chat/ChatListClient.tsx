'use client';

import dynamic from 'next/dynamic';

const ChatList = dynamic(() => import('@/widgets/chat').then((mod) => mod.ChatList), {
  ssr: false,
});

export default ChatList;
