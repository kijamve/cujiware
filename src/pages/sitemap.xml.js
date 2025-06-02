import { getCollection } from 'astro:content';

export async function GET() {
  const baseUrl = import.meta.env.SITE || 'https://cujiware.com';
  const currentDate = new Date();

  const staticPages = [
    '/',
    '/desarrollo-plugins',
    '/pasarelas-pago-venezuela',
    '/privacidad',
    '/terminos',
    '/reembolsos',
    '/suscripcion',
    '/mi-cuenta',
    '/dashboard'
  ];

  // Páginas dinámicas de plugins
  const countries = ['all', 'venezuela', 'argentina'];
  const platforms = ['woocommerce', 'prestashop'];
  
  const dynamicPages = countries.flatMap(country => 
    platforms.map(platform => `/plugins/${country}/${platform}`)
  );

  const pages = [
    ...staticPages,
    ...dynamicPages
  ].map(url => ({
    url,
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
        <loc>${baseUrl}${page.url}</loc>
        <lastmod>${page.lastModified.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page.url === '/' ? '1.0' : '0.8'}</priority>
      </url>
    `).join('')}
  </urlset>`;
}