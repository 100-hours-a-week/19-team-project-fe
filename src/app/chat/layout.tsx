import { ChatStack } from '@/widgets/chat';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ChatStack>{children}</ChatStack>;
}
