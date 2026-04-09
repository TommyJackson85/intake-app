/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ NEW: Turbopack config (replaces webpack)
  turbopack: {
    resolveAlias: {
      '@': '.', // Matches tsconfig paths @/* -> ./*
    },
  },

  // ✅ Security headers + CSP
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'

    // CSP: dev allows Vercel Live and relaxed script; prod is stricter
    // Extend connect-src when adding new external APIs (e.g. analytics, monitoring)
    const connectSrc = [
      "'self'",
      'https://*.supabase.co', // Supabase REST, auth, realtime
      'https://*.ingest.de.sentry.io', // Sentry error reporting
    ]
    if (isDev) {
      connectSrc.push('https://vercel.live', 'ws://localhost:*', 'http://localhost:*')
    }

    const scriptSrc = ["'self'", "'unsafe-inline'"]
    if (isDev) {
      scriptSrc.push("'unsafe-eval'", 'https://vercel.live') // Vercel Live feedback script
    }

    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc.join(' ')}`,
      `script-src-elem 'self' 'unsafe-inline'${isDev ? " https://vercel.live" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data: https://r2cdn.perplexity.ai",
      "img-src 'self' data: https: blob:",
      `connect-src ${connectSrc.join(' ')}`,
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
    ].join('; ')

    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: csp },
      ],
    }]
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