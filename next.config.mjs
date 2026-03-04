import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'refit-storage-prod.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
};

export default withBundleAnalyzer(nextConfig);
