import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { SITE_URL as BASE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: '2026-11-07', changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: '2026-11-07', changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: '2026-11-06', changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/refund-policy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/dmca`, lastModified: '2026-11-07', changeFrequency: 'yearly', priority: 0.2 },
  ];

  const postsDirectory = path.join(process.cwd(), 'content/blog');
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const filenames = fs.readdirSync(postsDirectory);
    blogPages = filenames
      .filter((f) => f.endsWith('.md'))
      .map((filename) => {
        const { data } = matter(fs.readFileSync(path.join(postsDirectory, filename), 'utf8'));
        return {
          url: `${BASE_URL}/blog/${filename.replace('.md', '')}`,
          lastModified: data.lastUpdated || data.date || undefined,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        };
      });
  } catch (err) {
    console.error('sitemap: failed to read content/blog', err);
  }

  return [...staticPages, ...blogPages];
}
