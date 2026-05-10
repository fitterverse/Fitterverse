import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/features/website/lib/blog'

export const runtime = 'edge'
export const alt = 'Fitterverse Blog'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  const title = post?.title ?? 'Fitterverse Blog'
  const category = post?.category ?? 'Health & Fitness'
  const readingTime = post?.readingTime ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0B0F0D',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(245,242,234,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,242,234,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* green glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(63,209,122,0.18) 0%, transparent 70%)',
          }}
        />

        {/* top — logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          {/* F mark */}
          <div
            style={{
              width: 48,
              height: 48,
              background: '#1A1F1C',
              borderRadius: 14,
              border: '1px solid rgba(63,209,122,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              color: '#3FD17A',
            }}
          >
            F
          </div>
          <div>
            <div style={{ color: '#F5F2EA', fontSize: 20, fontWeight: 600, letterSpacing: -0.5 }}>
              Fitterverse
            </div>
            <div style={{ color: 'rgba(245,242,234,0.45)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
              fitterverse.in
            </div>
          </div>
        </div>

        {/* middle — category + title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(63,209,122,0.12)',
              border: '1px solid rgba(63,209,122,0.25)',
              borderRadius: 999,
              padding: '6px 16px',
              color: '#3FD17A',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              width: 'fit-content',
            }}
          >
            {category}
          </div>
          <div
            style={{
              color: '#F5F2EA',
              fontSize: title.length > 60 ? 42 : 52,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              maxWidth: 900,
            }}
          >
            {title}
          </div>
        </div>

        {/* bottom — reading time + tagline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ color: 'rgba(245,242,234,0.45)', fontSize: 16, letterSpacing: 0.5 }}>
            {readingTime && `${readingTime} · `}Accountability partner for diet &amp; workouts
          </div>
          <div
            style={{
              background: '#3FD17A',
              color: '#0B0F0D',
              borderRadius: 999,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            Read article →
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
