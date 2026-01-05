import { GetServerSideProps } from 'next';
import { getAllArticles, BlogArticle } from '~/lib/blog';

function generateSiteMap(articles: BlogArticle[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.com';
  const now = new Date().toISOString();

  // Static pages
  const staticPages = [
    '',
    '/legal',
    '/privacy',
    '/terms',
    '/cgv',
    '/blog',
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
           xmlns:xhtml="http://www.w3.org/1999/xhtml">
     ${staticPages
       .map((path) => {
         return `
       <url>
           <loc>${baseUrl}${path}</loc>
           <lastmod>${now}</lastmod>
           <changefreq>${path === '' ? 'daily' : 'weekly'}</changefreq>
           <priority>${path === '' ? '1.0' : '0.8'}</priority>
           <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}${path}" />
           <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en${path}" />
           <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />
       </url>
     `;
       })
       .join('')}
     ${articles
       .map((article) => {
         const path = `/blog/${article.slug}`;
         const parsedDate = Date.parse(article.publishedAt);
         const lastmod = Number.isNaN(parsedDate) ? now : new Date(parsedDate).toISOString();

         return `
       <url>
           <loc>${baseUrl}${path}</loc>
           <lastmod>${lastmod}</lastmod>
           <changefreq>monthly</changefreq>
           <priority>0.7</priority>
           <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}${path}" />
           <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en${path}" />
           <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Generate the XML sitemap
  const articles = getAllArticles();
  const sitemap = generateSiteMap(articles);

  res.setHeader('Content-Type', 'text/xml');
  // Cache for 1 day
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default SiteMap;
