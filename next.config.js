/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ NEW: Turbopack config (replaces webpack)
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },

  // ✅ Security headers
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    }];
  },

  // ✅ NEW: remotePatterns instead of domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
  },

  // ❌ REMOVED: swcMinify, eslint, webpack config

  poweredByHeader: false,
};

module.exports = nextConfig;