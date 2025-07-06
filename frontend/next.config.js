/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
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
  webpack: (config) => {
    // Handle WebSocket connections
    config.externals = [...(config.externals || []), 'ws'];
    return config;
  },
};

module.exports = nextConfig;