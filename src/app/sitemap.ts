import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { SITE_URL as BASE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: '2026-11-23' },
    { url: `${BASE_URL}/blog`, lastModified: '2026-11-23' },
    { url: `${BASE_URL}/about`, lastModified: '2026-11-23' },
    { url: `${BASE_URL}/contact`, lastModified: '2026-11-07' },
    { url: `${BASE_URL}/privacy`, lastModified: '2026-11-06' },
    { url: `${BASE_URL}/terms`, lastModified: '2026-11-23' },
    { url: `${BASE_URL}/refund-policy`, lastModified: '2026-11-07' },
    { url: `${BASE_URL}/dmca`, lastModified: '2026-11-07' },
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
        };
      });
  } catch (err) {
    console.error('sitemap: failed to read content/blog', err);
  }

  return [...staticPages, ...blogPages];
}
