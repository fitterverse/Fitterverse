import type { MetadataRoute } from 'next'
import { siteConfig } from '@/features/website/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/progress', '/history', '/badges', '/login', '/signup', '/onboarding'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
