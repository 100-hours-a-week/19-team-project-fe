import Image from 'next/image';
import { getKakaoAuthorizeUrl } from '../api/kakaoAuthorize';

export default function KakaoLoginButton() {
  const kakaoAuthUrl = getKakaoAuthorizeUrl();

  return (
    <a href={kakaoAuthUrl} className="block w-full transition active:scale-[0.100]">
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
