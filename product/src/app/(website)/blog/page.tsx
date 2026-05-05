import type { Metadata } from 'next'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { getAllPosts } from '@/features/website/lib/blog'

export const metadata: Metadata = {
  title: 'Fitness and health blog',
  description:
    'Read Fitterverse articles on diet accountability, workout consistency, healthier routines, and sustainable progress.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Fitterverse Blog',
    description:
      'Fitness and health articles focused on consistency, diet habits, workout follow-through, and practical behavior change.',
    url: '/blog',
  },
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts()

  return (
    <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
            Fitterverse Blog
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Fitness and health writing built around habits that survive real life.
          </h1>
          <p className="mt-5 text-lg leading-8 text-foreground/72">
            Articles on diet accountability, workout consistency, recovery, behavior change, and the
            systems that make progress easier to repeat.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {posts.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-primary/20 hover:bg-white/[0.045]"
            >
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
                <span>{post.category}</span>
                <span className="h-1 w-1 rounded-full bg-primary/75" />
                <span>{format(parseISO(post.date), 'MMM d, yyyy')}</span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground transition group-hover:text-primary">
                {post.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-foreground/68">{post.description}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-foreground/55">
                <span>{post.readingTime}</span>
                <span className="inline-flex items-center gap-2 font-semibold text-primary">
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
