import type { Metadata } from 'next'
import { siteConfig } from '@/features/website/lib/site'
import type { BlogPost } from '@/features/website/lib/blog'

/* ─── blog post ──────────────────────────────────────────────────────────── */
export function blogPostMetadata(post: BlogPost): Metadata {
  const canonicalPath = `/blog/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: canonicalPath },
    keywords: post.tags,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: canonicalPath,
      siteName: siteConfig.name,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

/* ─── generic page ───────────────────────────────────────────────────────── */
export function pageMetadata(opts: {
  title: string
  description: string
  path: string
  keywords?: string[]
  noIndex?: boolean
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    ...(opts.keywords ? { keywords: opts.keywords } : {}),
    ...(opts.noIndex ? { robots: 'noindex, nofollow' } : {}),
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: opts.path,
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
  }
}
