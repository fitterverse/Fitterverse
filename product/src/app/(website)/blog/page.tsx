import type { Metadata } from 'next'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { getAllPosts } from '@/features/website/lib/blog'

export const metadata: Metadata = {
  title: 'Health & Fitness Blog — Diet, Workouts, and Habit Building',
  description:
    'Read Fitterverse articles on calorie deficit, diet accountability, workout consistency, BMR tracking, and building health habits that survive real life.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Fitterverse Blog — Diet, Workouts, and Habit Building',
    description:
      'Practical health writing on calorie tracking, workout habits, diet consistency, and the systems that make progress easier to repeat.',
    url: '/blog',
  },
}

const CATEGORY_COLORS: Record<string, string> = {
  Nutrition:        '#3FD17A',  /* Vital Green */
  Workouts:         '#3FD17A',  /* Vital Green */
  'Habit Building': '#E8A95B',  /* Saffron */
  Habits:           '#E8A95B',  /* Saffron */
  Mindset:          '#8E4D87',  /* Plum */
  'Fitness & Health': '#E8A95B',
}

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? '#22c55e'
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts()
  const featured = posts.find(p => p.featured) ?? posts[0]
  const rest = posts.filter(p => p.slug !== featured?.slug)

  return (
    <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
            Fitterverse Blog
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Health writing built around habits that survive real life.
          </h1>
          <p className="mt-5 text-lg leading-8 text-foreground/72">
            Articles on calorie deficit, diet accountability, workout consistency, BMR tracking, and the systems that make progress easier to repeat.
          </p>
        </div>

        {/* Featured post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mt-10 block rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,_rgba(63,209,122,0.08),_rgba(255,255,255,0.02)_50%)] p-6 transition hover:border-primary/25 sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: getCategoryColor(featured.category) + '20',
                  color: getCategoryColor(featured.category),
                }}
              >
                {featured.category}
              </span>
              <span className="text-xs text-foreground/50">
                {format(parseISO(featured.date), 'MMM d, yyyy')}
              </span>
              <span className="text-xs text-foreground/50">{featured.readingTime}</span>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                Featured
              </span>
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground transition group-hover:text-primary sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/68">
              {featured.description}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Read article
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        )}

        {/* All other posts */}
        {rest.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-primary/20 hover:bg-white/[0.045]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: getCategoryColor(post.category) + '20',
                      color: getCategoryColor(post.category),
                    }}
                  >
                    {post.category}
                  </span>
                  <span className="text-xs text-foreground/50">
                    {format(parseISO(post.date), 'MMM d, yyyy')}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground transition group-hover:text-primary leading-snug">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-foreground/65 line-clamp-3">
                  {post.description}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm text-foreground/50">
                  <span>{post.readingTime}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                    Read
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
