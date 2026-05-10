import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { BlogMarkdown } from '@/features/website/components/blog-markdown'
import { JsonLd, articleSchema, breadcrumbSchema, schemaGraph, blogPostMetadata } from '@/features/seo'
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from '@/features/website/lib/blog'
import { siteConfig } from '@/features/website/lib/site'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()
  return blogPostMetadata(post)
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(post.slug)

  return (
    <>
      <JsonLd
        data={schemaGraph(
          articleSchema({
            title: post.title,
            description: post.description,
            slug: post.slug,
            datePublished: post.date,
            tags: post.tags,
          }),
          breadcrumbSchema([
            { name: 'Home', item: siteConfig.url },
            { name: 'Blog', item: `${siteConfig.url}/blog` },
            { name: post.title, item: `${siteConfig.url}/blog/${post.slug}` },
          ]),
        )}
      />

      <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="mx-auto w-full max-w-6xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article>
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary/78">
                  <span>{post.category}</span>
                  <span className="h-1 w-1 rounded-full bg-primary/78" />
                  <span>{format(parseISO(post.date), 'MMMM d, yyyy')}</span>
                  <span className="h-1 w-1 rounded-full bg-primary/78" />
                  <span>{post.readingTime}</span>
                </div>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {post.title}
                </h1>
                <p className="mt-5 text-lg leading-8 text-foreground/72">{post.description}</p>

                {/* Author byline */}
                <div className="mt-6 flex items-center gap-3 border-t border-white/8 pt-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-bold text-primary">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.author}</p>
                    <p className="text-xs text-muted-foreground">Health &amp; Fitness Writing Team · {post.readingTime}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-[2rem] border border-white/8 bg-white/[0.03] p-7 sm:p-8">
                <BlogMarkdown content={post.body} />
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
                  Keep building
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                  Turn insight into a repeatable system.
                </h2>
                <p className="mt-4 text-sm leading-7 text-foreground/68">
                  Fitterverse is being built to make food decisions, workouts, and weekly consistency
                  easier to notice, log, and improve.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-foreground"
                  >
                    Login
                  </Link>
                </div>
              </div>

              {relatedPosts.length > 0 && (
                <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6">
                  <p className="text-sm font-semibold text-foreground">Related articles</p>
                  <div className="mt-5 space-y-4">
                    {relatedPosts.map(relatedPost => (
                      <Link
                        key={relatedPost.slug}
                        href={`/blog/${relatedPost.slug}`}
                        className="block rounded-2xl border border-white/8 bg-background/40 p-4 transition hover:border-primary/20"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
                          {relatedPost.category}
                        </p>
                        <p className="mt-2 text-base font-semibold leading-6 text-foreground">
                          {relatedPost.title}
                        </p>
                        <p className="mt-2 text-sm text-foreground/58">{relatedPost.readingTime}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6">
                <p className="text-sm font-semibold text-foreground">Tags</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/8 bg-background/45 px-3 py-1.5 text-xs font-medium text-foreground/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-12 flex justify-end">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              More articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
