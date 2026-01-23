import { ChatStack } from '@/widgets/chat-stack';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ChatStack>{children}</ChatStack>;
}
