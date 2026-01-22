declare module 'lottie-react' {
  import { CSSProperties } from 'react';

  export interface LottieOptions {
    animationData: unknown;
    loop?: boolean;
    autoplay?: boolean;
    style?: CSSProperties;
    className?: string;
    onComplete?: () => void;
    onLoopComplete?: () => void;
    onEnterFrame?: () => void;
    onSegmentStart?: () => void;
  }

  export default function Lottie(props: LottieOptions): JSX.Element;
}
