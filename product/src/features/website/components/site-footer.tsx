import Link from 'next/link'
import { siteConfig, websiteNavLinks } from '@/features/website/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-black">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.4fr_0.9fr_0.9fr] lg:px-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
            {siteConfig.name}
          </p>
          <p className="max-w-xl text-sm leading-7 text-foreground/68">
            Accountability for diet, workouts, and sustainable health routines for people who want a
            calmer system they can actually keep using.
          </p>
          <p className="text-xs text-foreground/45">
            Fitterverse supports habit building and self-tracking. It is not a substitute for medical advice.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Explore</p>
          <div className="flex flex-col gap-2 text-sm text-foreground/68">
            <Link href="/">Home</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/login">Login</Link>
            <Link href="/signup">Create account</Link>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Legal</p>
          <div className="flex flex-col gap-2 text-sm text-foreground/68">
            {websiteNavLinks
              .filter(link => link.href !== '/blog')
              .map(link => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
          </div>
          <p className="pt-3 text-xs text-foreground/45">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
