import Image from 'next/image';

export default function KakaoLoginButton() {
  return (
    <button type="button" className="w-full transition active:scale-[0.98]">
      <Image
        src="/icons/kakao_login_large_wide.png"
        alt="카카오로 로그인"
        width={320}
        height={48}
        className="h-auto w-full"
      />
    </button>
  );
}
