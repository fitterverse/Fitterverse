import { Fragment } from 'react'

interface BlogMarkdownProps {
  content: string
}

function isOrderedListItem(line: string) {
  return /^\d+\.\s/.test(line)
}

export function BlogMarkdown({ content }: BlogMarkdownProps) {
  const lines = content.split('\n')
  const blocks: Array<{ type: string; content?: string; items?: string[] }> = []

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

    const paragraph: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('## ') &&
      !lines[index].trim().startsWith('### ') &&
      !lines[index].trim().startsWith('- ') &&
      !lines[index].trim().startsWith('> ') &&
      !isOrderedListItem(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push({ type: 'p', content: paragraph.join(' ') })
  }

  return (
    <div className="article-prose">
      {blocks.map((block, index) => {
        if (block.type === 'h2') {
          return <h2 key={`${block.type}-${index}`}>{block.content}</h2>
        }

        if (block.type === 'h3') {
          return <h3 key={`${block.type}-${index}`}>{block.content}</h3>
        }

        if (block.type === 'quote') {
          return <blockquote key={`${block.type}-${index}`}>{block.content}</blockquote>
        }

        if (block.type === 'ul') {
          return (
            <ul key={`${block.type}-${index}`}>
              {block.items?.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ol') {
          return (
            <ol key={`${block.type}-${index}`}>
              {block.items?.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          )
        }

        return (
          <Fragment key={`${block.type}-${index}`}>
            <p>{block.content}</p>
          </Fragment>
        )
      })}
    </div>
  )
}
