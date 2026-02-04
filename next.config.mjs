const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
};

export default nextConfig;
