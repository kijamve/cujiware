import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://cujiware.com',
  output: 'server',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('api/'),
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es'
        }
      }
    }),
    react()
  ]
});