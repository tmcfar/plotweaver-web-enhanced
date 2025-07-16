/** @type {import('next').NextConfig} */
import { default as bundleAnalyzer } from '@next/bundle-analyzer';
import { InjectManifest } from 'workbox-webpack-plugin';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

console.log('=== Next.js Config Environment Variables ===');
console.log('NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT:', process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT);
console.log('NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
console.log('==========================================');

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
            swSrc: join(__dirname, 'src', 'service-worker.js'),
            swDest: '../public/sw.js',
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
    // Use Docker service names when BFF_HOST is set, otherwise localhost
    const bffHost = process.env.BFF_HOST || 'localhost:8000';
    const backendHost = process.env.BACKEND_HOST || 'localhost:5000';
    
    return [
      // Proxy API calls to FastAPI BFF service
      {
        source: '/api/bff/:path*',
        destination: `http://${bffHost}/:path*`,
      },
      // Proxy backend API calls when running in Docker
      {
        source: '/api/backend/:path*',
        destination: `http://${backendHost}/api/:path*`,
      },
      // Existing proxies for specific endpoints
      {
        source: '/api/preview/:path*',
        destination: `http://${bffHost}/api/preview/:path*`,
      },
      {
        source: '/api/sync/:path*',
        destination: `http://${bffHost}/api/sync/:path*`,
      },
      {
        source: '/ws',
        destination: `http://${bffHost}/ws`,
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
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
    NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT: process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT || 'http://localhost:3000/(auth)/github/callback',
  },
};

export default withBundleAnalyzer(nextConfig);
