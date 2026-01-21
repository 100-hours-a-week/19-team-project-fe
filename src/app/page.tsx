import { HomeContent } from '@/widgets/home';
import { Header } from '@/widgets/header';
import { SplashGate } from '@/widgets/splash-screen';

export default function Home() {
  return (
    <SplashGate durationMs={5000}>
      <Header />
      <HomeContent />
    </SplashGate>
  );
}
