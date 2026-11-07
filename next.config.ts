import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Migrated WordPress media — remove after re-hosting to Supabase Storage
      {
        protocol: 'https',
        hostname: 'thrivevineyard.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
  // Confirmed legacy paths with a working destination. Campaign URLs still need
  // Search Console and active Ads destination review before migration.
  async redirects() {
    return [
      { source: '/im-new', destination: '/plan-a-visit', permanent: true },
      { source: '/teaching', destination: '/sermons', permanent: true },
      { source: '/upcoming-events/:slug', destination: '/events/:slug', permanent: true },
      { source: '/kids', destination: '/kids-youth', permanent: true },
      { source: '/series/:slug', destination: '/sermons/series/:slug', permanent: true },
      { source: '/youth-alpha', destination: '/ministries/youth-alpha', permanent: true },
      { source: '/topics/:slug', destination: '/sermons', permanent: false },
      { source: '/book/:slug', destination: '/sermons', permanent: false },
      { source: '/service-type/:slug', destination: '/sermons', permanent: false },
    ]
  },
}

export default nextConfig
