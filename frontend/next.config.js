/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const { InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');

const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Optimize bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
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

      // Add service worker support in production
      if (!dev) {
        config.plugins.push(
          new InjectManifest({
            swSrc: path.join(__dirname, 'public', 'sw.js'),
            swDest: path.join(__dirname, 'public', 'sw.js'),
            exclude: [/\.map$/, /^manifest.*\.js$/, /_buildManifest\.js$/],
          })
        );
      }
    }
    return config;
  },
  
  // PWA configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      // Proxy API calls to FastAPI backend
      {
        source: '/api/preview/:path*',
        destination: 'http://localhost:8000/api/preview/:path*',
      },
      {
        source: '/api/sync/:path*',
        destination: 'http://localhost:8000/api/sync/:path*',
      },
      {
        source: '/ws',
        destination: 'http://localhost:8000/ws',
      },
    ];
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },
};

module.exports = withBundleAnalyzer(nextConfig);
