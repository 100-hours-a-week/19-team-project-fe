import { AgentConsole } from '@/widgets/agent';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function AgentPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#eef3f9]">
      <Header />
      <AgentConsole />
      <Footer />
    </div>
  );
}
