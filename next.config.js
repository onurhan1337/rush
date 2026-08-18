/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com'],
  async headers() {
    return [
      {
        source: '/rush.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/api/public/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };


    return config;
  },
};

module.exports = nextConfig;
