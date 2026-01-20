import { KakaoLoginButton } from '@/features/auth/social-login';

export default function SocialLoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fff8cc] via-white to-white px-6 py-16 text-gray-900">
      <section className="mx-auto flex w-full max-w-md flex-col gap-10">
        <header className="text-center">
          <p className="text-sm font-medium text-gray-500">re-fit</p>
          <h1 className="mt-3 text-2xl font-semibold">카카오 계정으로 시작하기</h1>
          <p className="mt-2 text-sm text-gray-600">한번의 로그인으로 바로 시작할 수 있어요.</p>
        </header>
        <div className="rounded-2xl bg-white p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          <KakaoLoginButton />
          <p className="mt-6 text-center text-xs text-gray-500">
            로그인 시 이용약관 및 개인정보 처리방침에 동의한 것으로 간주합니다.
          </p>
        </div>
      </section>
    </main>
  );
}
