import { GetServerSideProps } from 'next';

function generateSiteMap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.com';

  // Static pages
  const staticPages = [
    '',
    '/privacy',
    '/terms',
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
           <lastmod>${new Date().toISOString()}</lastmod>
           <changefreq>${path === '' ? 'daily' : 'weekly'}</changefreq>
           <priority>${path === '' ? '1.0' : '0.8'}</priority>
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
  const sitemap = generateSiteMap();

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
