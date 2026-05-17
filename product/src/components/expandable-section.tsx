'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ExpandableSectionProps {
  trigger: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function ExpandableSection({
  trigger,
  children,
  defaultOpen = false,
  className,
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('rounded-2xl border border-border bg-card overflow-hidden', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
          open && 'text-foreground border-b border-border'
        )}
      >
        <span>{trigger}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  )
}
