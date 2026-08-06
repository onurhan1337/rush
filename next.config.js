/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com'],
  // Webpack configuration
  webpack: (config) => {
    // Disable fs module on client side (required for Vercel)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

  
    return config;
  },
};

module.exports = nextConfig; 