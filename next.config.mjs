import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
};

export default withBundleAnalyzer(nextConfig);
