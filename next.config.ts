import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // 301 redirects from WordPress will be populated here after the SEO audit.
  // See docs/04-seo-url-migration-map.md (pending Google Search Console audit).
  async redirects() {
    return [
      // Example format:
      // { source: '/old-wordpress-path', destination: '/new-path', permanent: true },
    ]
  },
}

export default nextConfig
