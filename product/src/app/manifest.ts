import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fitterverse',
    short_name: 'Fitterverse',
    description: 'The accountability partner for healthier eating and consistent workouts.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0F0D',
    theme_color: '#0B0F0D',
    icons: [
      {
        src: '/favicons/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicons/pwa-192.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicons/pwa-512.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicons/maskable-512.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
