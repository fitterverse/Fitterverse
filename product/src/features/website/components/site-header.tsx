import Link from 'next/link'
import { Flame } from 'lucide-react'
import { siteConfig, websiteNavLinks } from '@/features/website/lib/site'

const primaryLinkClassName =
  'inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'

const secondaryLinkClassName =
  'inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-white/20 hover:bg-white/10'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="inline-flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary sm:h-10 sm:w-10">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold tracking-[0.16em] text-primary/85 sm:text-sm sm:tracking-[0.18em]">
              {siteConfig.shortName}
            </span>
            <span className="hidden text-xs text-foreground/60 sm:block">Consistency over crash plans</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-5 text-sm text-foreground/72">
            {websiteNavLinks.map(link => (
              <Link key={link.href} href={link.href} className="transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className={secondaryLinkClassName}>
              Login
            </Link>
            <Link href="/signup" className={primaryLinkClassName}>
              Start Free
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <Link href="/login" className="rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-foreground/80">
            Login
          </Link>
          <Link href="/signup" className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
            Start
          </Link>
        </div>
      </div>
    </header>
  )
}
