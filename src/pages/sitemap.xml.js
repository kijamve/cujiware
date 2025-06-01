import { getCollection } from 'astro:content';

export async function get() {
  const pages = [
    {
      url: '/',
      lastModified: new Date(),
    }
  ];
  
  // You can add more dynamic pages here when you create them
  
  return {
    body: generateSitemap(pages),
    headers: {
      'Content-Type': 'application/xml',
    },
  };
}

function generateSitemap(pages) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages.map(page => `
      <url>
        <loc>${import.meta.env.SITE}${page.url}</loc>
        <lastmod>${page.lastModified.toISOString()}</lastmod>
      </url>
    `).join('')}
  </urlset>`;
}