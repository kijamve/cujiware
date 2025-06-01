import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://cujiware.com',
  output: 'server',
  integrations: [
    tailwind(),
    sitemap(),
    react()
  ]
});