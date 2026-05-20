'use client'

import { useEffect, useState } from 'react'

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const updateProgress = () => {
      frame = 0

      const article = document.querySelector<HTMLElement>('[data-blog-article]')
      if (!article) {
        setProgress(0)
        return
      }

      const articleTop = window.scrollY + article.getBoundingClientRect().top
      const articleHeight = article.offsetHeight
      const start = articleTop - 112
      const end = articleTop + articleHeight - window.innerHeight * 0.55
      const nextProgress =
        end <= start ? Number(window.scrollY >= start) : clamp((window.scrollY - start) / (end - start))

      setProgress(current => (Math.abs(current - nextProgress) < 0.005 ? current : nextProgress))
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateProgress)
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
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[60px] z-30 sm:top-[72px]">
      <div className="h-[3px] bg-white/8">
        <div
          className="h-full origin-left bg-[linear-gradient(90deg,rgba(63,209,122,0.95),rgba(232,169,91,0.85))] transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </div>
  )
}
