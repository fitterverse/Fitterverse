'use client'

import { useEffect, useState } from 'react'
import type { BlogHeading } from '@/features/website/lib/blog-headings'

interface BlogTableOfContentsProps {
  headings: BlogHeading[]
  compact?: boolean
}

export function BlogTableOfContents({ headings, compact = false }: BlogTableOfContentsProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? '')

  useEffect(() => {
    if (compact || headings.length === 0) return

    let frame = 0

    const updateActiveHeading = () => {
      frame = 0

      const threshold = window.scrollY + 152
      let nextActiveId = headings[0]?.id ?? ''

      for (const heading of headings) {
        const element = document.getElementById(heading.id)
        if (!element) continue

        const top = window.scrollY + element.getBoundingClientRect().top
        if (top <= threshold) {
          nextActiveId = heading.id
          continue
        }

        break
      }

      setActiveId(current => (current === nextActiveId ? current : nextActiveId))
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateActiveHeading)
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [compact, headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="Table of contents" className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
        {compact ? 'Jump to a section' : 'On this page'}
      </p>
      <div className={compact ? 'mt-4 flex flex-wrap gap-2' : 'mt-5 space-y-1'}>
        {headings.map(heading => {
          const isActive = !compact && heading.id === activeId

          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              aria-current={isActive ? 'location' : undefined}
              className={
                compact
                  ? 'inline-flex rounded-full border border-white/10 bg-background/50 px-3 py-2 text-sm font-medium text-foreground/78 transition hover:border-primary/25 hover:text-foreground'
                  : `block rounded-2xl border px-3 py-2 text-sm leading-6 transition ${
                      isActive
                        ? 'border-primary/20 bg-primary/10 text-foreground'
                        : 'border-transparent text-foreground/68 hover:bg-background/50 hover:text-foreground'
                    } ${heading.level === 3 ? 'pl-7' : ''}`
              }
            >
              {heading.text}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
