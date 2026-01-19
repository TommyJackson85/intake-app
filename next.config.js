// next.config.js - Security headers configuration
// Copy-paste ready - add to your Next.js project

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Enable strict mode
  reactStrictMode: true,

  // ✅ Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          // HTTPS Strict Transport Security (only in production)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      // API routes: stricter CSP
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'application/json',
          },
        ],
      },
      // Dashboard: prevent caching
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // ✅ Redirects (e.g., HTTP to HTTPS)
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // ✅ Environment variables validation
  env: {
    // Ensure these are defined
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // ✅ Webpack optimizations
  webpack: (config, { isServer }) => {
    // Disable console in production builds
    if (!isServer) {
      config.optimization.minimize = true;
    }
    return config;
  },

  // ✅ Disable powered by header
  poweredByHeader: false,

  // ✅ Generate ETags for caching
  generateEtags: true,

  // ✅ Optimize production builds
  swcMinify: true,

  // ✅ Image optimization
  images: {
    domains: ['cdn.example.com'], // Add your CDN
    formats: ['image/avif', 'image/webp'],
  },

  // ✅ Compression
  compress: true,

  // ✅ TypeScript strict mode
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false, // Fail build if TS errors
  },

  // ✅ ESLint on build
  eslint: {
    dirs: ['app', 'lib', 'middleware.ts'],
    ignoreDuringBuilds: false, // Fail build if eslint errors
  },

  // ✅ Trailing slashes
  trailingSlash: false,
};

module.exports = nextConfig;