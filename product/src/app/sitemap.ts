import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/features/website/lib/blog'
import { siteConfig } from '@/features/website/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/terms`,
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/privacy-policy`,
      lastModified: new Date('2026-05-05'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const blogRoutes = posts.map(post => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...blogRoutes]
}
