import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { cache } from 'react'

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog')

export interface BlogPost {
  title: string
  description: string
  slug: string
  date: string
  author: string
  category: string
  tags: string[]
  featured: boolean
  body: string
  excerpt: string
  readingTime: string
}

function unquote(value: string) {
  return value.replace(/^['"]|['"]$/g, '')
}

function getExcerpt(body: string) {
  const firstParagraph = body
    .split('\n\n')
    .map(block => block.trim())
    .find(block => block && !block.startsWith('#') && !block.startsWith('- ') && !/^\d+\.\s/.test(block))

  return (firstParagraph || body).replace(/\n/g, ' ').trim().slice(0, 180)
}

function getReadingTime(body: string) {
  const words = body.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(3, Math.ceil(words / 180))
  return `${minutes} min read`
}

function parseMarkdownFile(raw: string, fallbackSlug: string): BlogPost {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

  if (!match) {
    throw new Error(`Missing frontmatter in blog post "${fallbackSlug}"`)
  }

  const [, rawFrontmatter, rawBody] = match
  const frontmatter: Record<string, string> = {}

  for (const line of rawFrontmatter.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const separatorIndex = trimmed.indexOf(':')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    frontmatter[key] = unquote(value)
  }

  const body = rawBody.trim()

  return {
    title: frontmatter.title || fallbackSlug,
    description: frontmatter.description || '',
    slug: frontmatter.slug || fallbackSlug,
    date: frontmatter.date || new Date().toISOString().slice(0, 10),
    author: frontmatter.author || 'Fitterverse Team',
    category: frontmatter.category || 'Fitness & Health',
    tags: frontmatter.tags
      ? frontmatter.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [],
    featured: frontmatter.featured === 'true',
    body,
    excerpt: getExcerpt(body),
    readingTime: getReadingTime(body),
  }
}

const loadPosts = cache(async () => {
  const entries = await readdir(BLOG_DIR)
  const files = entries.filter(file => file.endsWith('.md'))

  const posts = await Promise.all(
    files.map(async file => {
      const raw = await readFile(path.join(BLOG_DIR, file), 'utf8')
      return parseMarkdownFile(raw, file.replace(/\.md$/, ''))
    })
  )

  return posts.sort((left, right) => {
    return new Date(right.date).getTime() - new Date(left.date).getTime()
  })
})

export async function getAllPosts() {
  return loadPosts()
}

export async function getFeaturedPosts(limit = 3) {
  const posts = await loadPosts()
  const featured = posts.filter(post => post.featured)
  return (featured.length > 0 ? featured : posts).slice(0, limit)
}

export async function getAllPostSlugs() {
  const posts = await loadPosts()
  return posts.map(post => post.slug)
}

export async function getPostBySlug(slug: string) {
  const posts = await loadPosts()
  return posts.find(post => post.slug === slug) ?? null
}

export async function getRelatedPosts(slug: string, limit = 2) {
  const posts = await loadPosts()
  const currentPost = posts.find(post => post.slug === slug)

  if (!currentPost) return []

  return posts
    .filter(post => post.slug !== slug)
    .sort((left, right) => {
      const leftScore =
        Number(left.category === currentPost.category) +
        left.tags.filter(tag => currentPost.tags.includes(tag)).length
      const rightScore =
        Number(right.category === currentPost.category) +
        right.tags.filter(tag => currentPost.tags.includes(tag)).length

      return rightScore - leftScore
    })
    .slice(0, limit)
}
