import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AC Timer',
    short_name: 'AC Timer',
    description: 'SwitchBot AC Timer App',
    start_url: '/',
    display: 'standalone',
    background_color: '#343a40',
    theme_color: '#343a40',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
