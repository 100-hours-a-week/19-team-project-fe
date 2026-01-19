import type { ButtonHTMLAttributes } from 'react';

export type KakaoLoginButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function KakaoLoginButton({
  className = '',
  type = 'button',
  ...props
}: KakaoLoginButtonProps) {
  return (
    <button
      type={type}
      className={`relative flex w-full items-center justify-center gap-3 rounded-md bg-[#fee500] px-5 py-3 text-sm font-semibold text-[#1a1a1a] shadow-[0_12px_24px_rgba(254,229,0,0.35)] transition active:scale-[0.98] ${className}`}
      {...props}
    >
      <span className="absolute left-5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-[11px] font-bold text-[#fee500]">
        K
      </span>
      카카오로 계속하기
    </button>
  );
}
