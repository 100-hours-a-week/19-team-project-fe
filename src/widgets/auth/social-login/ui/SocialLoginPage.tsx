import { KakaoLoginButton } from '@/features/auth';

export default function SocialLoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#fff8cc] via-white to-white px-6 py-16 text-gray-900">
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="text-center" />
        <div className="mt-auto">
          <KakaoLoginButton />
        </div>
      </section>
    </main>
  );
}
