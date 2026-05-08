import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const viewport: Viewport = {
  themeColor: '#0B0F0D',
}

export const metadata: Metadata = {
  title: 'Fitterverse CRM',
  description: 'Internal CRM for the Fitterverse team',
  robots: 'noindex, nofollow',
  icons: {
    icon: [{ url: '/favicons/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicons/apple-touch-icon-180.svg',
  },
  manifest: '/favicons/manifest.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
