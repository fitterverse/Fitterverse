import Link from 'next/link'
import { Flame } from 'lucide-react'
import { siteConfig } from '@/features/website/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
                <Flame className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-[0.16em] text-primary/85">
                {siteConfig.name}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-7 text-foreground/60">
              Your accountability partner for diet and workout consistency. Build good habits one meal and one workout at a time — because consistency is the result, not the starting point.
            </p>
            <p className="text-xs text-foreground/38">
              Calorie estimates are approximate. Not a substitute for medical advice.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
              Product
            </p>
            <nav className="flex flex-col gap-2 text-sm text-foreground/65" aria-label="Product links">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Sign up free</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            </nav>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
              Features
            </p>
            <div className="flex flex-col gap-2 text-sm text-foreground/65">
              <span>Meal logging + streaks</span>
              <span>Workout calorie burn</span>
              <span>BMR &amp; TDEE calculator</span>
              <span>Calorie deficit tracking</span>
              <span>Progress history charts</span>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
              Legal
            </p>
            <nav className="flex flex-col gap-2 text-sm text-foreground/65" aria-label="Legal links">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of service</Link>
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy policy</Link>
            </nav>
            <p className="pt-4 text-xs text-foreground/38">
              © {new Date().getFullYear()} {siteConfig.name}.<br />All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
