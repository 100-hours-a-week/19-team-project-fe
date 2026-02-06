import Image from 'next/image';
import { useKakaoLoginUrl } from '@/features/auth';

export default function KakaoLoginButton() {
  const kakaoAuthUrl = useKakaoLoginUrl();

  return (
    <a href={kakaoAuthUrl} className="block w-full transition duration-150 active:scale-[0.985]">
      <Image
        src="/icons/kakao_login_large_wide.png"
        alt="카카오로 로그인"
        width={320}
        height={48}
        className="h-auto w-full"
      />
    </a>
  );
}
