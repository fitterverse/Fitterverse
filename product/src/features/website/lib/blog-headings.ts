export interface BlogHeading {
  id: string
  level: 2 | 3
  text: string
}

function stripMarkdown(text: string) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .trim()
}

function slugifyHeading(text: string) {
  const slug = stripMarkdown(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return slug || 'section'
}

export function extractBlogHeadings(content: string): BlogHeading[] {
  const slugCounts = new Map<string, number>()
  const headings: BlogHeading[] = []

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    let level: 2 | 3 | null = null
    let text = ''

    if (line.startsWith('## ')) {
      level = 2
      text = line.slice(3).trim()
    } else if (line.startsWith('### ')) {
      level = 3
      text = line.slice(4).trim()
    }

    if (!level || !text) continue

    const normalizedText = stripMarkdown(text)
    const baseId = slugifyHeading(normalizedText)
    const count = (slugCounts.get(baseId) ?? 0) + 1
    slugCounts.set(baseId, count)

    headings.push({
      id: count === 1 ? baseId : `${baseId}-${count}`,
      level,
      text: normalizedText,
    })
  }

  return headings
}
