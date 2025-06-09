import { getCollection } from 'astro:content';
import plugins from '../data/plugins.json';

export async function GET() {
  const baseUrl = import.meta.env.PUBLIC_APP_URL || 'https://cujiware.com';
  const currentDate = new Date();

  const staticPages = [
    '/',
    '/desarrollo-plugins',
    '/pasarelas-pago-venezuela',
    '/privacidad',
    '/terminos',
    '/reembolsos',
    '/suscripcion'
  ];

  // Páginas dinámicas de plugins
  const countries = ['all', 'venezuela', 'argentina'];
  const platforms = ['woocommerce', 'prestashop'];

  const dynamicPages = countries.flatMap(country =>
    platforms.map(platform => `/plugins/${country}/${platform}`)
  );

  // URLs de plugins individuales
  const pluginPages = plugins.map(plugin => ({
    url: `/plugins/${plugin.countries[0]}/${plugin.platform[0]}/${plugin.slug}`,
    lastModified: currentDate
  }));

  const pages = [
    ...staticPages,
    ...dynamicPages,
    ...pluginPages
  ].map(page => ({
    url: (typeof page === 'string' ? page : page.url).replace(/\/+/g, '/'), // Elimina slashes duplicados
    lastModified: currentDate
  }));

  const sitemap = generateSitemap(pages, baseUrl);

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

function generateSitemap(pages, baseUrl) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages.map(page => `
      <url>
        <loc>${baseUrl.replace(/\/+$/, '')}${page.url}</loc>
        <lastmod>${page.lastModified.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page.url === '/' ? '1.0' : '0.8'}</priority>
      </url>
    `).join('')}
  </urlset>`;
}
