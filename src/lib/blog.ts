import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
  };
  image: string;
  content: string;
}

const blogRootDirectory = path.join(process.cwd(), 'src/content/blog');

const getContentDirectory = (locale?: string) => {
  const normalizedLocale = locale === 'en' ? 'en' : 'fr';
  const localizedDirectory = path.join(blogRootDirectory, normalizedLocale);

  if (fs.existsSync(localizedDirectory)) {
    return localizedDirectory;
  }

  return blogRootDirectory;
};

export function getAllArticles(locale: string = 'fr'): BlogArticle[] {
  const contentDirectory = getContentDirectory(locale);
  // Check if directory exists
  if (!fs.existsSync(contentDirectory)) {
    console.warn(`Blog directory not found: ${contentDirectory}`);
    return [];
  }

  const fileNames = fs.readdirSync(contentDirectory);
  const articles = fileNames
    .filter((fileName) => fileName.endsWith('.md') && fileName !== 'README.md')
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(contentDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      const article: BlogArticle = {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        category: data.category,
        readTime: data.readTime,
        publishedAt: data.publishedAt,
        author: data.author,
        image: data.image,
        content,
      };

      return article;
    });

  // Sort by date (most recent first)
  return articles.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export function getArticleBySlug(slug: string, locale: string = 'fr'): BlogArticle | undefined {
  try {
    const contentDirectory = getContentDirectory(locale);
    const fullPath = path.join(contentDirectory, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
      return undefined;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const article: BlogArticle = {
      slug,
      title: data.title,
      excerpt: data.excerpt,
      category: data.category,
      readTime: data.readTime,
      publishedAt: data.publishedAt,
      author: data.author,
      image: data.image,
      content,
    };

    return article;
  } catch (error) {
    console.error(`Error reading article ${slug}:`, error);
    return undefined;
  }
}

export function getAllSlugs(locale: string = 'fr'): string[] {
  const contentDirectory = getContentDirectory(locale);

  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(contentDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md') && fileName !== 'README.md')
    .map((fileName) => fileName.replace(/\.md$/, ''));
}
