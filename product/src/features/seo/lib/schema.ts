import { siteConfig } from '@/features/website/lib/site'

/* ─── types ─────────────────────────────────────────────────────────────── */

export interface ArticleSchemaOptions {
  title: string
  description: string
  slug: string
  datePublished: string
  dateModified?: string
  author?: AuthorSchema
  tags?: string[]
}

export interface FaqItem {
  question: string
  answer: string
}

export interface AuthorSchema {
  name: string
  credential?: string  // e.g. "Certified Nutritionist, RD"
  url?: string         // author bio page when it exists
}

/* ─── placeholder author — replace when we have credentialed experts ─────── */
export const PLACEHOLDER_AUTHOR: AuthorSchema = {
  name: 'Fitterverse Editorial Team',
  credential: 'Health & Fitness Writing Team',
}

/* ─── builders ──────────────────────────────────────────────────────────── */

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/logo-mark.svg`,
    },
    sameAs: [],
  }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteConfig.url}/blog?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function articleSchema(opts: ArticleSchemaOptions) {
  const author = opts.author ?? PLACEHOLDER_AUTHOR
  const canonicalUrl = `${siteConfig.url}/blog/${opts.slug}`

  return {
    '@type': 'Article',
    '@id': `${canonicalUrl}#article`,
    headline: opts.title,
    description: opts.description,
    url: canonicalUrl,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.credential ? { jobTitle: author.credential } : {}),
      ...(author.url ? { url: author.url } : {}),
    },
    publisher: { '@id': `${siteConfig.url}/#organization` },
    mainEntityOfPage: canonicalUrl,
    inLanguage: 'en-IN',
    ...(opts.tags?.length ? { keywords: opts.tags.join(', ') } : {}),
  }
}

export function faqSchema(items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function breadcrumbSchema(crumbs: Array<{ name: string; item?: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.item ? { item: crumb.item } : {}),
    })),
  }
}

/* ─── graph wrapper — bundles multiple schemas into one @graph ───────────── */
export function schemaGraph(...nodes: Record<string, unknown>[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  }
}
