/**
 * Blog to Email Converter
 * Converts blog Markdown articles to styled HTML emails
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  sendEmailAt?: string; // Optional: When to send as email (YYYY-MM-DD)
  emailSent?: boolean; // Track if email was already sent
  author: {
    name: string;
    role: string;
  };
  image: string;
  content: string;
}

/**
 * Get all blog articles with frontmatter
 */
export function getBlogArticles(): BlogArticle[] {
  const blogDir = path.join(process.cwd(), 'src/content/blog');
  const files = fs.readdirSync(blogDir);

  const articles = files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(blogDir, file);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug: data.slug || file.replace('.md', ''),
        title: data.title,
        excerpt: data.excerpt,
        category: data.category,
        readTime: data.readTime,
        publishedAt: data.publishedAt,
        sendEmailAt: data.sendEmailAt,
        emailSent: data.emailSent || false,
        author: data.author,
        image: data.image,
        content,
      };
    });

  return articles;
}

/**
 * Get articles that should be sent as emails today
 */
export function getArticlesToSendToday(): BlogArticle[] {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const articles = getBlogArticles();

  return articles.filter(
    (article) =>
      article.sendEmailAt === today &&
      !article.emailSent
  );
}

/**
 * Convert Markdown content to styled HTML for email
 */
export function convertMarkdownToEmail(article: BlogArticle): string {
  // Configure marked for better HTML output
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Convert Markdown to HTML
  const htmlContent = marked(article.content);

  // Apply inline styles to HTML elements
  const styledContent = htmlContent
    // Headings
    .replace(
      /<h2>(.*?)<\/h2>/g,
      '<h2 style="margin: 30px 0 15px 0; color: #000000; font-size: 22px; font-weight: 600; line-height: 1.3;">$1</h2>'
    )
    .replace(
      /<h3>(.*?)<\/h3>/g,
      '<h3 style="margin: 25px 0 12px 0; color: #000000; font-size: 18px; font-weight: 600; line-height: 1.3;">$1</h3>'
    )
    .replace(
      /<h4>(.*?)<\/h4>/g,
      '<h4 style="margin: 20px 0 10px 0; color: #000000; font-size: 16px; font-weight: 600; line-height: 1.3;">$1</h4>'
    )
    // Paragraphs
    .replace(
      /<p>/g,
      '<p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; line-height: 1.6;">'
    )
    // Strong/Bold
    .replace(/<strong>/g, '<strong style="color: #000000; font-weight: 600;">')
    // Links
    .replace(
      /<a href="(.*?)">/g,
      '<a href="$1" style="color: #000000; text-decoration: underline; font-weight: 500;">'
    )
    // Lists
    .replace(
      /<ul>/g,
      '<ul style="margin: 15px 0; padding-left: 25px; color: #333333; font-size: 16px; line-height: 1.8;">'
    )
    .replace(
      /<ol>/g,
      '<ol style="margin: 15px 0; padding-left: 25px; color: #333333; font-size: 16px; line-height: 1.8;">'
    )
    .replace(
      /<li>/g,
      '<li style="margin-bottom: 8px;">'
    )
    // Blockquotes
    .replace(
      /<blockquote>/g,
      '<blockquote style="margin: 20px 0; padding: 15px 20px; background-color: #F5F5F5; border-left: 4px solid #000000; color: #666666; font-style: italic;">'
    )
    // Code blocks
    .replace(
      /<pre><code>(.*?)<\/code><\/pre>/gs,
      '<pre style="margin: 20px 0; padding: 15px; background-color: #F5F5F5; border: 1px solid #E0E0E0; overflow-x: auto;"><code style="font-family: monospace; font-size: 14px; color: #333333;">$1</code></pre>'
    )
    // Inline code
    .replace(
      /<code>(.*?)<\/code>/g,
      '<code style="padding: 2px 6px; background-color: #F5F5F5; border: 1px solid #E0E0E0; font-family: monospace; font-size: 14px; color: #333333;">$1</code>'
    );

  return styledContent;
}

/**
 * Generate full email HTML from blog article
 */
export function generateBlogEmail(article: BlogArticle): {
  subject: string;
  html: string;
  previewText: string;
} {
  const styledContent = convertMarkdownToEmail(article);
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.local';
  const articleUrl = `${APP_URL}/blog/${article.slug}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${article.excerpt}">
  <title>${article.title}</title>
  <style>
    /* Force white background - Gmail dark mode fix */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff !important;
      background-image: linear-gradient(#ffffff, #ffffff) !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff);" bgcolor="#ffffff">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff);">
    <tr>
      <td align="center" style="padding: 40px 20px; background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff);" bgcolor="#ffffff">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width: 600px; width: 100%; background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff);">

          <!-- Logo -->
          <tr>
            <td align="left" style="padding: 0 0 24px 0; background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff);" bgcolor="#ffffff">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="#000000"/>
                <text x="24" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-size="24" font-weight="600" fill="#FFFFFF" text-anchor="middle">B</text>
              </svg>
              <p style="margin: 8px 0 0 0; color: #717171; font-size: 14px;">
                ${article.category}
              </p>
            </td>
          </tr>

          <!-- Featured Image -->
          ${article.image ? `
          <tr>
            <td style="padding: 0; background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff);" bgcolor="#ffffff">
              <img src="${article.image}" alt="${article.title}" style="width: 100%; height: auto; display: block;" />
            </td>
          </tr>
          ` : ''}

          <!-- Article Content -->
          <tr>
            <td style="background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff); padding: 40px 0; color: #222222;" bgcolor="#ffffff">

              <!-- Article Title -->
              <h1 style="margin: 0 0 16px 0; color: #000000 !important; font-size: 26px; font-weight: 600; line-height: 1.3;">
                ${article.title}
              </h1>

              <!-- Article Meta -->
              <p style="margin: 0 0 24px 0; color: #717171 !important; font-size: 14px;">
                Par ${article.author.name} • ${article.readTime} de lecture
              </p>

              <!-- Article Body -->
              <div style="margin-bottom: 24px; color: #222222 !important;">
                ${styledContent}
              </div>

              <!-- Read More CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #000000; border-radius: 8px; text-align: center;" bgcolor="#000000">
                    <a href="${articleUrl}" style="display: inline-block; padding: 14px 24px; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Lire l'article complet
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #ffffff; background-image: linear-gradient(#ffffff, #ffffff); padding: 40px 0 0 0; text-align: left;" bgcolor="#ffffff">
              <p style="margin: 0 0 8px 0; color: #717171 !important; font-size: 14px; line-height: 1.5;">
                © ${new Date().getFullYear()} Moderateur Bedones
              </p>
              <p style="margin: 0; font-size: 14px;">
                <a href="{{unsubscribeUrl}}" style="color: #717171 !important; text-decoration: underline;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- Tracking pixel (replaced by mailer) -->
  {{trackingPixel}}
</body>
</html>
  `.trim();

  return {
    subject: `📖 ${article.title}`,
    html,
    previewText: article.excerpt,
  };
}

/**
 * Mark article as email sent (update frontmatter)
 */
export function markArticleAsEmailSent(slug: string): void {
  const blogDir = path.join(process.cwd(), 'src/content/blog');
  const files = fs.readdirSync(blogDir);

  const file = files.find((f) => f.includes(slug) || f === `${slug}.md`);
  if (!file) {
    console.error(`❌ Article not found: ${slug}`);
    return;
  }

  const filePath = path.join(blogDir, file);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // Update frontmatter
  data.emailSent = true;

  // Regenerate file with updated frontmatter
  const updatedContents = matter.stringify(content, data);
  fs.writeFileSync(filePath, updatedContents, 'utf8');

  console.log(`✅ Marked article as email sent: ${slug}`);
}
