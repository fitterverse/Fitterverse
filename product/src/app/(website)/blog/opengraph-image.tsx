import { ImageResponse } from 'next/og'

export const alt = 'Fitterverse Blog — Health & Fitness Writing'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const TOPICS = ['Calorie Tracking', 'Workout Habits', 'Indian Food Calories', 'BMR & TDEE', 'Habit Building', 'Diet Consistency']

export default function OgImage() {
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
          overflow: 'hidden',
        }}
      >
        {/* subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(rgba(245,242,234,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,242,234,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* green glow left */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 500,
            height: 500,
            display: 'flex',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(63,209,122,0.16) 0%, transparent 70%)',
          }}
        />

        {/* saffron glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            display: 'flex',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,169,91,0.12) 0%, transparent 70%)',
          }}
        />

        {/* top — logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', color: '#F5F2EA', fontSize: 20, fontWeight: 600, letterSpacing: -0.5 }}>
              Fitterverse
            </div>
            <div style={{ display: 'flex', color: 'rgba(245,242,234,0.45)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
              fitterverse.in
            </div>
          </div>
        </div>

        {/* middle — heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
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
              alignSelf: 'flex-start',
            }}
          >
            Health &amp; Fitness Blog
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', maxWidth: 820 }}>
            <span style={{ color: '#F5F2EA', fontSize: 56, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
              Real advice for&nbsp;
            </span>
            <span style={{ color: '#3FD17A', fontSize: 56, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
              real consistency
            </span>
          </div>

          <div style={{ display: 'flex', color: 'rgba(245,242,234,0.55)', fontSize: 20, lineHeight: 1.5, maxWidth: 680 }}>
            Calorie tracking, workout habits, and diet systems that survive real life in India.
          </div>

          {/* topic pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {TOPICS.map((topic, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(245,242,234,0.06)',
                  border: '1px solid rgba(245,242,234,0.1)',
                  borderRadius: 999,
                  padding: '5px 14px',
                  color: 'rgba(245,242,234,0.65)',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {topic}
              </div>
            ))}
          </div>
        </div>

        {/* bottom */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ display: 'flex', color: 'rgba(245,242,234,0.4)', fontSize: 15 }}>
            Accountability partner for diet &amp; workouts
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#3FD17A',
              color: '#0B0F0D',
              borderRadius: 999,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            Read articles →
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
