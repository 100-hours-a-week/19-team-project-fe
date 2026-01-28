import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 're-fit',
    short_name: 're-fit',
    description: 're-fit',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icons/char_icon.png',
        sizes: '347x347',
        type: 'image/png',
      },
    ],
  };
}
