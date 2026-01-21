import { HomeContent } from '@/widgets/home';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { SplashGate } from '@/widgets/splash-screen';

export default function Home() {
  return (
    <SplashGate durationMs={5000}>
      <Header />
      <HomeContent />
      <Footer />
    </SplashGate>
  );
}
