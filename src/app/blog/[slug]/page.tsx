import { AUTHOR } from '@/lib/author';
import React from 'react';
import { CHROME_STORE_URL, SITE_URL, SITE_NAME } from "@/lib/site";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DemoVideo from "@/components/DemoVideo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  jsonLd,
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  extractFaq,
} from "@/lib/seo";

function readPost(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return matter(fs.readFileSync(filePath, 'utf8'));
}

function computeReadingTime(markdownContent: string, override?: string): {
  wordCount: number;
  readingTime: string;
} {
  const wordCount = markdownContent
    .replace(/[#*`|>|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(3, Math.ceil(wordCount / 200));
  return {
    wordCount,
    readingTime: override || `${minutes} min read`,
  };
}

function getAllPosts() {
  const dir = path.join(process.cwd(), 'content/blog');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace('.md', '');
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
      const { readingTime } = computeReadingTime(content, data.readingTime as string | undefined);
      return {
        slug,
        title: (data.title as string) || slug,
        description: (data.description as string) || '',
        category: (data.category as string) || 'Guides',
        readingTime,
        visualType: (data.visualType as string) || slug,
        date: (data.date as string) || '2026-04-06',
      };
    });
}

function renderInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function convertMarkdownTables(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    const isHeaderRow = /^\s*\|.+\|\s*$/.test(line);
    const isSeparatorRow = nextLine !== undefined && /^\s*\|[\s\-:|]+\|\s*$/.test(nextLine);

    if (isHeaderRow && isSeparatorRow) {
      const parseRow = (rowStr: string) =>
        rowStr
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split(/(?<!\\)\|/)
          .map((cell) => renderInlineMarkdown(cell.replace(/\\\|/g, '|').trim()));

      const headers = parseRow(line);
      i += 2;
      const bodyRows: string[][] = [];

      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
        bodyRows.push(parseRow(lines[i]));
        i++;
      }

      const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${bodyRows
        .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
        .join('')}</tbody>`;

      out.push(`<div class="blog-table-wrap"><table class="blog-table">${thead}${tbody}</table></div>`);
    } else {
      out.push(line);
      i++;
    }
  }

  return out.join('\n');
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z0-9#]+;/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addHeadingIdsAndExtractToc(htmlString: string): {
  htmlWithIds: string;
  toc: { id: string; text: string }[];
} {
  const toc: { id: string; text: string }[] = [];
  const usedIds = new Set<string>();

  const htmlWithIds = htmlString.replace(/<h2>([\s\S]*?)<\/h2>/gi, (_match, inner) => {
    const plainText = inner
      .replace(/<[^>]*>/g, '')
      .replace(/&#x26;|&amp;/g, '&')
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();
    let id = slugifyHeading(plainText) || 'section';
    if (usedIds.has(id)) {
      let counter = 2;
      while (usedIds.has(`${id}-${counter}`)) counter++;
      id = `${id}-${counter}`;
    }
    usedIds.add(id);
    toc.push({ id, text: plainText });
    return `<h2 id="${id}">${inner}</h2>`;
  });

  return { htmlWithIds, toc };
}

export function generateStaticParams() {
  return fs
    .readdirSync(path.join(process.cwd(), 'content/blog'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ slug: f.replace('.md', '') }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = readPost(params.slug);
  if (!post) return {};
  const d = post.data;
  const url = `/blog/${params.slug}`;
  const seoTitle = d.seoTitle || `${d.title} | ${SITE_NAME}`;

  return {
    title: seoTitle,
    description: d.description,
    keywords: Array.isArray(d.keywords) ? d.keywords : undefined,
    authors: [{ name: d.author || SITE_NAME, url: SITE_URL }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}${url}`,
      title: seoTitle,
      description: d.description,
      siteName: SITE_NAME,
      publishedTime: d.date,
      modifiedTime: d.lastUpdated || d.date,
      authors: [d.author || SITE_NAME],
      section: d.category || 'Guides',
      tags: Array.isArray(d.keywords) ? d.keywords : undefined,
      images: [
        {
          url: `${SITE_URL}/opengraph-image.jpg`,
          width: 1200,
          height: 630,
          alt: d.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@skoolvideosaver',
      title: seoTitle,
      description: d.description,
      images: [`${SITE_URL}/opengraph-image.jpg`],
    },
  };
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const post = readPost(params.slug);
  if (!post) notFound();
  const { data, content } = post;

  const { wordCount, readingTime } = computeReadingTime(
    content,
    data.readingTime as string | undefined
  );

  const markdownWithTables = convertMarkdownTables(content);
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(markdownWithTables);

  const { htmlWithIds: contentHtml, toc } = addHeadingIdsAndExtractToc(
    processedContent.toString()
  );

  const loginButton = session
    ? `<a href="/dashboard"><button class="button button--secondary button--small">Dashboard</button></a>`
    : `<a href="/login"><button class="button button--secondary button--small">Login</button></a>`;

  const getItNowButton = session
    ? `<a href="/dashboard" target="_blank"><button class="button button--primary button--small">Get It Now</button></a>`
    : `<a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer"><button class="button button--primary button--small">Get It Now</button></a>`;

  const schemas: unknown[] = [
    articleSchema({
      title: data.title,
      description: data.description,
      slug: params.slug,
      date: data.date,
      modified: data.lastUpdated,
      keywords: Array.isArray(data.keywords) ? data.keywords : undefined,
      wordCount,
      category: data.category,
    }),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Guides & Tutorials', path: '/blog' },
      { name: data.title, path: `/blog/${params.slug}` },
    ]),
  ];

  const faq = extractFaq(content);
  if (faq.length) {
    schemas.push(faqSchema(faq));
  }

  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== params.slug)
    .sort((a, b) => {
      if (a.slug === 'how-to-download-skool-videos') return -1;
      if (b.slug === 'how-to-download-skool-videos') return 1;
      if (a.category === data.category && b.category !== data.category) return -1;
      if (b.category === data.category && a.category !== data.category) return 1;
      return 0;
    })
    .slice(0, 3);

  const quickFacts: { label: string; value: string }[] = Array.isArray(data.quickFacts)
    ? data.quickFacts
    : [];

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (iso?: unknown) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}` : '';
  };
  const updated = fmtDate(data.lastUpdated || data.date);
  const published = fmtDate(data.date);
  const installHref = session ? '/dashboard' : CHROME_STORE_URL;
  const theme = data.category === 'Comparisons' ? 'violet' : data.category === 'FAQ' ? 'green' : 'blue';

  return (
    <div className="page-blog-post" data-theme={theme}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schemas) }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .page-blog-post { background:#f6f5f1; color:#0f172a; }
        .pg-wrap { max-width:1120px; margin:0 auto; padding:0 20px; }
        .page-blog-post[data-theme="blue"] { --pg-a:#0b63ff; --pg-ink:#0a4fc4; --pg-d1:#061640; --pg-d2:#0b2a7a; --pg-l:#9cc2ff; --pg-glow:rgba(56,132,255,.55); --pg-tint:#eaf2ff; }
        .page-blog-post[data-theme="violet"] { --pg-a:#7c3aed; --pg-ink:#6d28d9; --pg-d1:#190d3d; --pg-d2:#3b1d8f; --pg-l:#c4b5fd; --pg-glow:rgba(167,139,250,.55); --pg-tint:#f1ebff; }
        .page-blog-post[data-theme="green"] { --pg-a:#059669; --pg-ink:#047857; --pg-d1:#04211a; --pg-d2:#0b4a38; --pg-l:#6ee7b7; --pg-glow:rgba(52,211,153,.5); --pg-tint:#e6f8f0; }
        .pg-progress { position:fixed; top:0; left:0; width:100%; height:3px; background:var(--pg-a); transform-origin:0 50%; transform:scaleX(0); z-index:60; animation:pgprog linear both; animation-timeline:scroll(root); }
        @keyframes pgprog { to { transform:scaleX(1); } }
        @supports not (animation-timeline:scroll()) { .pg-progress { display:none; } }
        .pg-hero { position:relative; overflow:hidden; color:#fff; padding:0 0 44px; background:linear-gradient(135deg,var(--pg-d1),var(--pg-d2)); }
        .pg-hero::before { content:""; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px); background-size:46px 46px; -webkit-mask-image:radial-gradient(ellipse at 70% 0%,#000 10%,transparent 70%); mask-image:radial-gradient(ellipse at 70% 0%,#000 10%,transparent 70%); pointer-events:none; }
        .pg-hero::after { content:""; position:absolute; right:-140px; top:-180px; width:620px; height:620px; border-radius:50%; background:radial-gradient(circle,var(--pg-glow),transparent 66%); pointer-events:none; }
        .pg-hero .pg-wrap { position:relative; z-index:1; }
        .pg-crumbs { padding:22px 0 0; font-size:.85rem; color:rgba(255,255,255,.7); display:flex; flex-wrap:wrap; gap:6px; }
        .pg-crumbs a { color:rgba(255,255,255,.7); text-decoration:none; } .pg-crumbs a:hover { color:#fff; }
        .pg-hero-grid { display:grid; grid-template-columns:minmax(0,1fr) 380px; gap:40px; align-items:end; padding-top:30px; }
        .pg-head { padding:0; }
        .pg-tags { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }
        .pg-tag { font-size:.75rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#0b1220; background:var(--pg-l); padding:5px 12px; border-radius:999px; }
        .pg-tag-plain { color:#fff; background:rgba(255,255,255,.14); }
        .pg-head h1 { font-size:clamp(2.1rem,4.6vw,3.35rem); line-height:1.08; letter-spacing:-.03em; font-weight:800; margin:0 0 16px; color:#fff; }
        .pg-desc { font-size:1.12rem; line-height:1.65; color:rgba(255,255,255,.82); margin:0 0 22px; max-width:640px; }
        .pg-by { display:flex; align-items:center; gap:12px; font-size:.9rem; color:rgba(255,255,255,.78); flex-wrap:wrap; }
        .pg-by img { width:36px; height:36px; border-radius:10px; background:#fff; padding:4px; }
        .pg-by strong { color:#fff; }
        .pg-author { color:#fff; font-weight:700; text-decoration:underline; text-decoration-color:rgba(255,255,255,.4); text-underline-offset:3px; }
        .pg-bio { display:flex; gap:16px; align-items:flex-start; margin:40px 0 0; padding:20px 22px; background:#fff; border:1px solid #e0ddd4; border-radius:18px; }
        .pg-bio img { width:52px; height:52px; border-radius:14px; background:var(--pg-tint); padding:8px; flex:0 0 auto; }
        .pg-bio-label { font-size:.72rem; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--pg-ink); margin-bottom:2px; }
        .pg-bio strong a { color:#0f172a; text-decoration:none; font-size:1.05rem; }
        .pg-bio p { margin:4px 0 0; font-size:.92rem; line-height:1.6; color:#475569; }
        .pg-bio-links a { color:var(--pg-ink); font-weight:600; }
        .pg-by span.sep { color:rgba(255,255,255,.35); }
        .pg-answer { background:#fff; color:#0f172a; border-radius:22px; padding:22px 24px; box-shadow:0 24px 60px rgba(0,0,0,.3); position:relative; }
        .pg-answer::before { content:""; position:absolute; left:24px; top:0; width:44px; height:5px; border-radius:0 0 6px 6px; background:var(--pg-a); }
        .pg-answer-label { font-size:.75rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--pg-ink); margin:6px 0 8px; }
        .pg-answer p { margin:0; font-size:.98rem; line-height:1.65; color:#1e293b; }
        .pg-facts { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:30px 0 0; }
        .pg-fact { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.16); border-radius:16px; padding:14px 16px; backdrop-filter:blur(6px); }
        .pg-fact dt { font-size:.7rem; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--pg-l); margin-bottom:5px; }
        .pg-fact dd { margin:0; font-size:.92rem; font-weight:700; line-height:1.4; color:#fff; }
        .pg-grid { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:48px; padding:40px 0 24px; align-items:start; }
        .pg-article { min-width:0; max-width:740px; }
        .pg-prose { font-size:1.06rem; line-height:1.75; color:#334155; counter-reset:sec; }
        .pg-prose > *:first-child { margin-top:0; }
        .pg-prose h2 { counter-increment:sec; font-size:1.7rem; line-height:1.25; font-weight:800; letter-spacing:-.02em; color:#0f172a; margin:2.8em 0 .7em; padding-top:1.1em; border-top:1px solid #e0ddd4; scroll-margin-top:90px; }
        .pg-prose h2::before { content:counter(sec, decimal-leading-zero); display:table; font-size:.78rem; font-weight:800; letter-spacing:.1em; color:var(--pg-ink); background:var(--pg-tint); padding:3px 10px; border-radius:999px; margin-bottom:10px; }
        .pg-prose > h2:first-child { border-top:0; padding-top:0; }
        .pg-prose h3 { font-size:1.18rem; line-height:1.35; font-weight:700; color:#0f172a; margin:1.8em 0 .4em; padding-left:12px; border-left:3px solid var(--pg-a); }
        .page-blog-post .pg-prose p, .page-blog-post .pg-prose li, .page-blog-post .pg-prose td { color:#334155; opacity:1; }
        .page-blog-post .pg-prose strong { color:#0f172a; }
        .pg-prose p { margin:0 0 1.1em; }
        .pg-prose a { color:var(--pg-ink); font-weight:600; text-decoration:underline; text-decoration-color:var(--pg-a); text-decoration-thickness:1.5px; text-underline-offset:3px; }
        .pg-prose a:hover { background:var(--pg-tint); }
        .pg-prose strong { color:#0f172a; }
        .pg-prose ul, .pg-prose ol { margin:0 0 1.2em; padding-left:1.4em; }
        .pg-prose li { margin:.4em 0; padding-left:.2em; }
        .pg-prose li::marker { color:var(--pg-a); font-weight:700; }
        .pg-prose ol { list-style:none; counter-reset:st; padding:0; }
        .pg-prose ol > li { counter-increment:st; position:relative; background:#fff; border:1px solid #e7e5df; border-radius:16px; padding:14px 18px 14px 64px; margin:10px 0; }
        .pg-prose ol > li::before { content:counter(st); position:absolute; left:14px; top:13px; width:36px; height:36px; border-radius:12px; background:var(--pg-a); color:#fff; font-weight:800; display:grid; place-items:center; }
        .pg-prose ol > li > ul, .pg-prose ol > li > ol { margin:.6em 0 0; }
        .pg-prose code { font-size:.88em; background:#ebe9e2; color:#0f172a; padding:.15em .4em; border-radius:6px; }
        .pg-prose pre { background:#0f172a; color:#e2e8f0; border-radius:14px; padding:18px 20px; overflow-x:auto; margin:0 0 1.3em; font-size:.88rem; line-height:1.6; }
        .pg-prose pre code { background:transparent; color:inherit; padding:0; }
        .pg-prose blockquote { margin:0 0 1.2em; padding:14px 18px; background:var(--pg-tint); border-left:4px solid var(--pg-a); border-radius:0 14px 14px 0; color:#334155; }
        .pg-prose blockquote p:last-child { margin:0; }
        .pg-prose hr { border:0; border-top:1px solid #e7e5df; margin:2em 0; }
        .blog-table-wrap { width:100%; overflow-x:auto; margin:1.4em 0 1.8em; border:1px solid #e0ddd4; border-radius:16px; background:#fff; box-shadow:0 10px 30px rgba(15,23,42,.06); }
        .blog-table { width:100%; border-collapse:collapse; font-size:.92rem; line-height:1.55; text-align:left; }
        .blog-table th { background:linear-gradient(135deg,var(--pg-d1),var(--pg-d2)); color:#fff; font-size:.74rem; letter-spacing:.05em; text-transform:uppercase; padding:12px 16px; font-weight:700; }
        .blog-table td { padding:12px 16px; border-top:1px solid #efede7; vertical-align:top; color:#334155; }
        .blog-table tbody tr:nth-child(even) { background:#faf9f6; }
        .pg-side { position:sticky; top:84px; display:grid; gap:16px; }
        .pg-card { background:#fff; border:1px solid #e7e5df; border-radius:18px; padding:20px; }
        .pg-card h2 { font-size:.75rem; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:#64748b; margin:0 0 12px; }
        .pg-toc { list-style:none; margin:0; padding:0; display:grid; gap:2px; }
        .pg-toc a { display:block; padding:7px 10px; border-radius:8px; font-size:.88rem; line-height:1.4; color:#475569; text-decoration:none; }
        .pg-toc a:hover { background:var(--pg-tint); color:var(--pg-ink); }
        .pg-install { background:linear-gradient(160deg,var(--pg-d1),var(--pg-d2)); border-color:transparent; color:#cbd5e1; }
        .pg-install h2 { color:var(--pg-l); }
        .pg-install strong { display:block; color:#fff; font-size:1.05rem; margin-bottom:6px; }
        .pg-install p { margin:0 0 14px; font-size:.9rem; line-height:1.55; }
        .pg-btn { display:block; text-align:center; background:var(--pg-a); color:#fff; font-weight:700; padding:12px 16px; border-radius:12px; text-decoration:none; transition:background .2s; }
        .pg-btn:hover { filter:brightness(.9); }
        .pg-install small { display:block; margin-top:10px; font-size:.78rem; color:#94a3b8; }
        .pg-mtoc { display:none; margin:24px 0 0; background:#fff; border:1px solid #e7e5df; border-radius:14px; padding:0 16px; }
        .pg-mtoc summary { cursor:pointer; font-weight:700; padding:14px 0; }
        .pg-mtoc .pg-toc { padding-bottom:12px; }
        .pg-video { margin:36px auto 0; max-width:820px; }
        .pg-video-frame { border-radius:20px; overflow:hidden; box-shadow:0 20px 50px rgba(15,23,42,.14); border:1px solid #e0ddd4; }
        .pg-video h2 { font-size:1.2rem; font-weight:800; margin:0 0 12px; text-align:center; }
        .pg-standards { margin:20px 0 0; padding:20px 24px; background:#fff; border:1px solid #e7e5df; border-left:4px solid var(--pg-a); border-radius:14px; color:#475569; line-height:1.65; font-size:.93rem; }
        .pg-standards strong { color:#0f172a; } .pg-standards a { color:var(--pg-ink); font-weight:600; }
        .pg-cta { margin:40px 0 0; background:linear-gradient(135deg,var(--pg-d1),var(--pg-d2)); border-radius:26px; padding:36px 32px; color:#cbd5e1; display:flex; gap:24px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
        .pg-cta h3 { color:#fff; font-size:1.5rem; font-weight:800; margin:0 0 6px; }
        .pg-cta p { margin:0; max-width:460px; line-height:1.6; }
        .pg-cta small { display:block; margin-top:8px; color:#94a3b8; font-size:.8rem; }
        .pg-cta .pg-btn { padding:14px 24px; white-space:nowrap; }
        .pg-related { padding:48px 0 72px; }
        .pg-related h2 { font-size:1.5rem; font-weight:800; margin:0 0 18px; }
        .pg-related-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .pg-rel { display:flex; flex-direction:column; background:#fff; border:1px solid #e7e5df; border-radius:18px; padding:20px; text-decoration:none; color:inherit; transition:transform .2s, box-shadow .2s; }
        .pg-rel:hover { transform:translateY(-3px); box-shadow:0 14px 34px rgba(15,23,42,.09); }
        .pg-rel span { font-size:.72rem; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:var(--pg-ink); margin-bottom:8px; }
        .pg-rel h3 { font-size:1.02rem; line-height:1.4; font-weight:700; margin:0 0 8px; }
        .pg-rel p { margin:0; font-size:.88rem; color:#64748b; line-height:1.55; flex:1; }
        @media (max-width:1000px) {
          .pg-grid { grid-template-columns:minmax(0,1fr); gap:0; }
          .pg-side { display:none; }
          .pg-mtoc { display:block; }
          .pg-facts { grid-template-columns:repeat(2,1fr); }
          .pg-hero-grid { grid-template-columns:minmax(0,1fr); gap:26px; }
          .pg-related-grid { grid-template-columns:1fr; }
        }
        @media (max-width:600px) {
          .pg-head h1 { font-size:1.85rem; }
          .pg-prose { font-size:1rem; }
          .pg-prose h2 { font-size:1.45rem; }
          .pg-facts { grid-template-columns:1fr; }
          .pg-cta { padding:26px 20px; }
          .pg-cta .pg-btn { width:100%; }
        }
      `,
        }}
      />

      <div className="page-index site-layout">
        <header className="index-header">
          <div className="header-container">
            <a className="header-logo" href="/">
              <img src="/assets/images/img_a38993e738.png" height="30" width="30" alt="Video Saver for Skool logo" />
              <span>Video Saver for Skool</span>
            </a>
            <nav className="header-nav">
              <a href="/#features">Features</a>
              <a href="/#pricing">Pricing</a>
              <a href="/blog" style={{ fontWeight: 600, color: '#0b63ff' }}>Guides</a>
            </nav>
            <div className="header-actions" dangerouslySetInnerHTML={{ __html: loginButton + getItNowButton }} />
          </div>
        </header>

        <main>
          <div className="pg-progress" aria-hidden="true" />
          <section className="pg-hero">
          <div className="pg-wrap">
            <nav className="pg-crumbs" aria-label="Breadcrumb">
              <a href="/">Home</a><span>/</span>
              <a href="/blog">Guides</a><span>/</span>
              <span aria-current="page">{String(data.users || data.category || 'Article')}</span>
            </nav>

            <div className="pg-hero-grid">
            <header className="pg-head">
              <div className="pg-tags">
                <span className="pg-tag">{String(data.category || 'Guides')}</span>
                <span className="pg-tag pg-tag-plain">{readingTime}</span>
              </div>
              <h1>{String(data.title)}</h1>
              <p className="pg-desc">{String(data.description || '')}</p>
              <div className="pg-by">
                <img src="/assets/images/img_a38993e738.png" alt="" width="36" height="36" />
                <a className="pg-author" href={AUTHOR.url} target="_blank" rel="noopener noreferrer author">{AUTHOR.name}</a>
                <span className="sep">·</span>
                <span>Updated {updated}</span>
                {published && published !== updated && (
                  <>
                    <span className="sep">·</span>
                    <span>Published {published}</span>
                  </>
                )}
              </div>
            </header>

            {data.tldr && (
              <section className="pg-answer" aria-label="Quick answer">
                <div className="pg-answer-label">Quick answer</div>
                <p>{String(data.tldr)}</p>
              </section>
            )}
            </div>

            {quickFacts.length > 0 && (
              <dl className="pg-facts" aria-label="At a glance">
                {quickFacts.slice(0, 4).map((f) => (
                  <div className="pg-fact" key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          </section>

          <div className="pg-wrap">
            {toc.length > 0 && (
              <details className="pg-mtoc">
                <summary>On this page</summary>
                <ul className="pg-toc">
                  {toc.map((t) => (
                    <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>
                  ))}
                </ul>
              </details>
            )}

            {data.video_url && (
              <section className="pg-video" aria-label="Demo video">
                <h2>Watch the demo</h2>
                <div className="pg-video-frame"><DemoVideo /></div>
              </section>
            )}

            <div className="pg-grid">
              <article className="pg-article">
                <div className="pg-prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />

                <aside className="pg-bio" aria-label="About the author">
                  <img src="/assets/images/img_a38993e738.png" alt="" width="52" height="52" />
                  <div>
                    <div className="pg-bio-label">About the author</div>
                    <strong><a href={AUTHOR.url} target="_blank" rel="noopener noreferrer author">{AUTHOR.name}</a></strong>
                    <p>{AUTHOR.bio}</p>
                    <p className="pg-bio-links"><a href={AUTHOR.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a> · <a href={AUTHOR.github} target="_blank" rel="noopener noreferrer">GitHub</a></p>
                  </div>
                </aside>

                <p className="pg-standards">
                  <strong>Editorial standards.</strong> Written by someone who works on {SITE_NAME}, so read product claims with that in mind. Facts about our own product are checked against the current extension, pricing page and refund policy. Facts about other tools come from their public Chrome Web Store listings or project pages and are labelled as such. Last reviewed {updated}. Spotted an error? Email <a href="mailto:hello@skoolvideosaver.com">hello@skoolvideosaver.com</a>.
                </p>

                <section className="pg-cta" aria-label="Install the extension">
                  <div>
                    <h3>Ready to save your Skool videos as MP4?</h3>
                    <p>Install {SITE_NAME} and try it on your own lessons with 5 free downloads. No credit card required.</p>
                    <small>Then $20/month or Lifetime Pro (current price on the homepage) · 14-day refund policy</small>
                  </div>
                  <a className="pg-btn" href={installHref} target="_blank" rel="noopener noreferrer">Add to Chrome - 5 free downloads</a>
                </section>
              </article>

              <aside className="pg-side" aria-label="Article tools">
                {toc.length > 0 && (
                  <nav className="pg-card" aria-label="On this page">
                    <h2>On this page</h2>
                    <ul className="pg-toc">
                      {toc.map((t) => (
                        <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>
                      ))}
                    </ul>
                  </nav>
                )}
                <div className="pg-card pg-install">
                  <h2>Chrome extension</h2>
                  <strong>{SITE_NAME}</strong>
                  <p>Saves Skool lessons and community videos as MP4 files, processed in your browser.</p>
                  <a className="pg-btn" href={installHref} target="_blank" rel="noopener noreferrer">Install free extension</a>
                  <small>5 free downloads · <a href="/#pricing" style={{ color: '#93c5fd' }}>See pricing</a></small>
                </div>
              </aside>
            </div>

            <section className="pg-related" aria-label="Related guides">
              <h2>Related guides</h2>
              <div className="pg-related-grid">
                {relatedPosts.map((rp) => (
                  <a key={rp.slug} className="pg-rel" href={`/blog/${rp.slug}`}>
                    <span>{rp.category}</span>
                    <h3>{rp.title}</h3>
                    <p>{rp.description}</p>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </main>

        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-features">
              <h4 className="footer-section-title" aria-level={3}>Guides</h4>
              <div className="footer-features-grid">
                {allPosts.map((p) => (
                  <a key={p.slug} className="footer-feature-link" href={`/blog/${p.slug}`}>{p.title}</a>
                ))}
                <a className="footer-feature-link" href="/#pricing">Pricing</a>
              </div>
            </div>
            <div className="footer-divider"></div>
            <div className="footer-bottom">
              <div className="footer-brand">
                <img src="/assets/images/img_987e4189cb.png" alt="Video Saver for Skool logo" className="footer-logo" />
                <span>© 2026 Video Saver for Skool</span>
              </div>
              <div className="footer-links">
                <a href="/#pricing">Pricing</a>
                <a href="/blog">Blog</a>
                <a href="/contact">Contact</a>
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
                <a href="/refund-policy">Refund</a>
                <a href="/dmca">DMCA</a>
              </div>
              <div className="footer-meta">
                <span>Chrome Extension</span>
                <span className="footer-separator">•</span>
                <a href="mailto:hello@skoolvideosaver.com" className="footer-email">hello@skoolvideosaver.com</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
