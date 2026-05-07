'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ExpandableSectionProps {
  trigger: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function ExpandableSection({ trigger, children, defaultOpen = false }: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {trigger}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}
