import { HomeContent } from '@/widgets/home';
import { SplashGate } from '@/widgets/splash-screen';

export default function Home() {
  return (
    <SplashGate durationMs={5000}>
      <HomeContent />
    </SplashGate>
  );
}
