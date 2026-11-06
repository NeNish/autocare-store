/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || 'http://localhost:5000';

const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // The repo root also has a lockfile (for the `npm run dev` helper); this app lives here
    root: import.meta.dirname,
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  // Browser calls go to /api/* on the Next.js origin and are proxied to Express,
  // so the httpOnly auth cookie is first-party and no CORS setup is needed in the browser.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
