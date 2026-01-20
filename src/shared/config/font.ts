import localFont from 'next/font/local';

export const pretendard = localFont({
  src: [
    {
      path: '../asset/fonts/Pretendard-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../asset/fonts/Pretendard-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../asset/fonts/Pretendard-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../asset/fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../asset/fonts/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../asset/fonts/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../asset/fonts/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../asset/fonts/Pretendard-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../asset/fonts/Pretendard-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-pretendard',
});
