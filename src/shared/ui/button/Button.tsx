import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: ButtonVariant;
};

export default function Button({
  children,
  disabled,
  icon,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'relative inline-flex w-full items-center justify-center gap-3 rounded-md py-3 mt-3 font-medium transition active:scale-[0.98]';

  const variants: Record<ButtonVariant, string> = {
    primary: `
      bg-primary-main/80
      border border-white/20
      text-white
      hover:bg-primary-main/70
      active:bg-primary-main/90
      disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 disabled:active:scale-100 disabled:shadow-black/20
    `,
    secondary: `
      bg-gray-200 text-black
      hover:bg-gray-300
      active:bg-gray-400
      disabled:bg-gray-200 disabled:text-gray-400
    `,
    ghost: `
      bg-transparent text-primary-main
      hover:bg-primary-main/10
      disabled:text-gray-400
    `,
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {icon ? (
        <span className="absolute left-[20px] top-1/2 shrink-0 -translate-y-1/2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
