import { Fragment, type ReactNode } from 'react'
import { extractBlogHeadings } from '@/features/website/lib/blog-headings'

interface BlogMarkdownProps {
  content: string
}

interface TableBlock {
  type: 'table'
  headers: string[]
  rows: string[][]
}

interface TextBlock {
  type: 'h2' | 'h3' | 'quote' | 'p' | 'hr'
  content?: string
}

interface ListBlock {
  type: 'ul' | 'ol'
  items: string[]
}

type BlogBlock = TableBlock | TextBlock | ListBlock

function isOrderedListItem(line: string) {
  return /^\d+\.\s/.test(line)
}

function isHorizontalRule(line: string) {
  return /^---+$/.test(line)
}

function isTableSeparator(line: string) {
  const normalized = line.trim().replace(/^\||\|$/g, '')
  if (!normalized.includes('|')) return false

  return normalized
    .split('|')
    .map(part => part.trim())
    .every(part => /^:?-{3,}:?$/.test(part))
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cell => cell.trim())
}

function renderInline(content: string) {
  const tokenPattern = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g
  const nodes: ReactNode[] = []
  let lastIndex = 0

  for (const match of content.matchAll(tokenPattern)) {
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      nodes.push(content.slice(lastIndex, matchIndex))
    }

    if (match[2]) {
      nodes.push(
        <strong key={`strong-${matchIndex}`} className="font-semibold text-foreground">
          {match[2]}
        </strong>
      )
    } else if (match[3] && match[4]) {
      nodes.push(
        <a
          key={`link-${matchIndex}`}
          href={match[4]}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline decoration-primary/45 underline-offset-4 transition hover:decoration-primary"
        >
          {match[3]}
        </a>
      )
    }

    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : content
}

export function BlogMarkdown({ content }: BlogMarkdownProps) {
  const lines = content.split('\n')
  const blocks: BlogBlock[] = []
  const headings = extractBlogHeadings(content)

  for (let index = 0; index < lines.length; ) {
    const line = lines[index].trim()

    if (!line) {
      index += 1
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.slice(3).trim() })
      index += 1
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4).trim() })
      index += 1
      continue
    }

    if (isHorizontalRule(line)) {
      blocks.push({ type: 'hr' })
      index += 1
      continue
    }

    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', content: line.slice(2).trim() })
      index += 1
      continue
    }

    if (line.startsWith('- ')) {
      const items: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2).trim())
        index += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (isOrderedListItem(line)) {
      const items: string[] = []
      while (index < lines.length && isOrderedListItem(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s/, '').trim())
        index += 1
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    const nextLine = lines[index + 1]?.trim() ?? ''
    if (line.includes('|') && isTableSeparator(nextLine)) {
      const headers = splitTableRow(line)
      const rows: string[][] = []
      index += 2

      while (index < lines.length) {
        const rowLine = lines[index].trim()
        if (!rowLine || !rowLine.includes('|')) break
        rows.push(splitTableRow(rowLine))
        index += 1
      }

      blocks.push({ type: 'table', headers, rows })
      continue
    }

    const paragraph: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('## ') &&
      !lines[index].trim().startsWith('### ') &&
      !isHorizontalRule(lines[index].trim()) &&
      !lines[index].trim().startsWith('- ') &&
      !lines[index].trim().startsWith('> ') &&
      !isOrderedListItem(lines[index].trim()) &&
      !(lines[index].trim().includes('|') && isTableSeparator(lines[index + 1]?.trim() ?? ''))
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push({ type: 'p', content: paragraph.join(' ') })
  }

  return (
    <div className="article-prose">
      {(() => {
        let headingIndex = 0

        return blocks.map((block, index) => {
          if (block.type === 'h2') {
            const heading = headings[headingIndex]
            headingIndex += 1

            return (
              <h2 key={`${block.type}-${index}`} id={heading?.id} className="scroll-mt-28">
                {renderInline(block.content || '')}
              </h2>
            )
          }

          if (block.type === 'h3') {
            const heading = headings[headingIndex]
            headingIndex += 1

            return (
              <h3 key={`${block.type}-${index}`} id={heading?.id} className="scroll-mt-28">
                {renderInline(block.content || '')}
              </h3>
            )
          }

          if (block.type === 'hr') {
            return <hr key={`${block.type}-${index}`} />
          }

          if (block.type === 'quote') {
            return <blockquote key={`${block.type}-${index}`}>{renderInline(block.content || '')}</blockquote>
          }

          if (block.type === 'ul') {
            return (
              <ul key={`${block.type}-${index}`}>
                {block.items?.map(item => (
                  <li key={item}>{renderInline(item)}</li>
                ))}
              </ul>
            )
          }

          if (block.type === 'ol') {
            return (
              <ol key={`${block.type}-${index}`}>
                {block.items?.map(item => (
                  <li key={item}>{renderInline(item)}</li>
                ))}
              </ol>
            )
          }

          if (block.type === 'table') {
            return (
              <div key={`${block.type}-${index}`} className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      {block.headers.map(header => (
                        <th key={header}>{renderInline(header)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`${row.join('-')}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${cell}-${cellIndex}`}>{renderInline(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }

          if (block.type === 'p') {
            return (
              <Fragment key={`${block.type}-${index}`}>
                <p>{renderInline(block.content || '')}</p>
              </Fragment>
            )
          }

          return null
        })
      })()}
    </div>
  )
}
