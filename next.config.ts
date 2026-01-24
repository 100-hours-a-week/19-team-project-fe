import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
};

export default nextConfig;
