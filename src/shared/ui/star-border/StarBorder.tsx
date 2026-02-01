import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  innerClassName?: string;
  innerStyle?: React.CSSProperties;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
  starOpacity?: number;
  starSize?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  innerClassName = '',
  innerStyle,
  color = '#4aa3ff',
  speed = '6s',
  thickness = 1,
  starOpacity = 0.7,
  starSize = 10,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[999px] ${className}`}
      {...(rest as React.ComponentPropsWithoutRef<T>)}
      style={{
        padding: `${thickness}px 0`,
        ...(rest as React.ComponentPropsWithoutRef<T>).style,
      }}
    >
      <div
        className="absolute bottom-[-11px] right-[-250%] z-0 h-[50%] w-[300%] rounded-full animate-star-movement-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent ${starSize}%)`,
          animationDuration: speed,
          opacity: starOpacity,
        }}
      />
      <div
        className="absolute left-[-250%] top-[-10px] z-0 h-[50%] w-[300%] rounded-full animate-star-movement-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent ${starSize}%)`,
          animationDuration: speed,
          opacity: starOpacity,
        }}
      />
      <div
        className={`relative z-[1] rounded-[999px] border border-[#2b3440] bg-gradient-to-b from-[#0b0f17] to-[#111827] px-4 py-3 text-center text-sm text-white ${innerClassName}`}
        style={innerStyle}
      >
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
