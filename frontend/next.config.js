/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\/]node_modules[\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          editor: {
            test: /(monaco|tiptap)/,
            name: 'editor',
            priority: 10,
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  async rewrites() {
    return [
      // Proxy API calls to FastAPI backend
      {
        source: '/api/preview/:path*',
        destination: 'http://localhost:8000/api/preview/:path*',
      },
      {
        source: '/ws',
        destination: 'http://localhost:8000/ws',
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);