/** @type {import('next').NextConfig} */

/**
 * GitHub Pages static-export mode.
 *
 * Enabled only when GITHUB_PAGES=true (see `npm run build:github-pages`).
 * Default / Vercel builds leave this unset so basePath, export output, and
 * trailingSlash stay unchanged for the live application.
 */
const isGithubPages = process.env.GITHUB_PAGES === 'true'

/** Repository project-pages base path (https://tommyjackson85.github.io/intake-app/). */
const GITHUB_PAGES_BASE_PATH = '/intake-app'

const nextConfig = {
  reactStrictMode: true,

  // Turbopack config (replaces webpack)
  turbopack: {
    resolveAlias: {
      '@': '.', // Matches tsconfig paths @/* -> ./*
    },
  },

  // GitHub Pages: static HTML under /intake-app with folder-style trailing slashes.
  // Vercel: omit basePath/assetPrefix/output so routes stay at the deployment root.
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: GITHUB_PAGES_BASE_PATH,
        assetPrefix: GITHUB_PAGES_BASE_PATH,
        trailingSlash: true,
        // Default Next export directory (`out/`) is what GH Pages should publish.
        images: {
          unoptimized: true,
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'cdn.example.com',
            },
          ],
        },
      }
    : {
        images: {
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'cdn.example.com',
            },
          ],
        },
      }),

  // Security headers + CSP — unsupported with `output: 'export'`, so skip on GH Pages.
  ...(isGithubPages
    ? {}
    : {
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
            `script-src-elem 'self' 'unsafe-inline'${isDev ? ' https://vercel.live' : ''}`,
            "style-src 'self' 'unsafe-inline'",
            'font-src \'self\' data: https://r2cdn.perplexity.ai',
            "img-src 'self' data: https: blob:",
            `connect-src ${connectSrc.join(' ')}`,
            "worker-src 'self' blob:",
            "frame-ancestors 'none'",
          ].join('; ')

          return [
            {
              source: '/(.*)',
              headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'Content-Security-Policy', value: csp },
              ],
            },
          ]
        },
      }),

  poweredByHeader: false,
}

module.exports = nextConfig
