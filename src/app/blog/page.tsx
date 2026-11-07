import React from 'react';
import { CHROME_STORE_URL, SITE_URL, SITE_NAME } from "@/lib/site";
import { jsonLd, blogCollectionSchema, breadcrumbSchema } from "@/lib/seo";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: 'Skool Video Downloader Blog: Guides & Comparisons (2026)',
  description:
    'Guides for saving Skool lessons as MP4: how-to steps, Loom and free-plan guides, tool comparisons, and the rules on personal offline use.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    title: 'Skool Video Downloader Guides & Comparisons | Video Saver for Skool',
    description:
      'Step-by-step guides and tool comparisons for saving Skool classroom lessons and community replays as MP4 files.',
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/opengraph-image.jpg`, width: 1200, height: 630, alt: 'Video Saver for Skool guides and comparisons' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@skoolvideosaver',
    title: 'Skool Video Downloader Guides & Comparisons (2026)',
    description: 'How to save Skool videos as MP4, which tools exist, and what the rules are. 5 free downloads included.',
    images: [`${SITE_URL}/opengraph-image.jpg`],
  },
};

type Post = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  lastUpdated?: string;
  date?: string;
  [key: string]: unknown;
};

// Reader goals, in the order we want to present them. Titles and one-liners are written for the hub.
const PATHS: { slug: string; goal: string; blurb: string; tag: string }[] = [
  { slug: 'how-to-download-skool-videos', goal: 'Save a lesson as an MP4', blurb: 'The full walkthrough: install, click Download, pick a quality. Covers every supported player and what to do when the button is missing.', tag: 'Start here' },
  { slug: 'download-skool-videos-free', goal: 'Try it before paying', blurb: 'What the 5 free downloads include, how they compare with other free options, and when upgrading makes sense.', tag: 'Free plan' },
  { slug: 'download-loom-videos-from-skool', goal: 'Save a Loom video', blurb: 'How embedded Loom lessons work in Skool, including password-protected ones you can already watch.', tag: 'Loom' },
  { slug: 'save-skool-course-before-membership-expires', goal: 'Archive a course before access ends', blurb: 'A checklist for backing up classroom lessons and call replays while your membership is still active.', tag: 'Checklist' },
  { slug: 'skool-video-downloader-alternatives', goal: 'Compare the tools', blurb: 'Two other extensions and the open-source yt-dlp, compared on players, free limits and price from their public listings.', tag: 'Comparison' },
  { slug: 'yt-dlp-vs-extension-for-skool-videos', goal: 'Use the terminal instead', blurb: 'The yt-dlp workflow for Skool, how to fix HTTP 403 errors, and when an extension saves you the manual steps.', tag: 'Technical' },
];

const QUICK_ANSWERS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Can you download videos from Skool?',
    a: <>Skool has no built-in download button for most lessons. A browser extension such as Video Saver for Skool can save lessons you already have access to as MP4 files. Start with the <Link href="/blog/how-to-download-skool-videos">step-by-step guide</Link>.</>,
  },
  {
    q: 'Which video players are covered?',
    a: <>Video Saver for Skool supports Skool&apos;s native player and YouTube, Loom, Vimeo and Wistia embeds. The <Link href="/blog/download-loom-videos-from-skool">Loom guide</Link> covers password-protected videos.</>,
  },
  {
    q: 'Is there a free way to do it?',
    a: <>Video Saver for Skool includes 5 free downloads, then costs $20/month or a one-time Lifetime Pro plan. The open-source yt-dlp is free if you are comfortable in a terminal. See the <Link href="/blog/download-skool-videos-free">free-plan guide</Link>.</>,
  },
  {
    q: 'Is it legal?',
    a: <>It depends on your country&apos;s copyright rules and your community&apos;s terms. The tool is meant for personal offline study of content you can already access, not for sharing or reselling. This is general information, not legal advice. Read <Link href="/blog/is-it-legal-to-download-skool-videos">the full explanation</Link>.</>,
  },
  {
    q: 'Does it work on a phone or tablet?',
    a: <>No. Video Saver for Skool is a desktop extension for Chromium browsers (Chrome, Brave, Edge, Opera). Download on a computer, then copy the MP4 to your device.</>,
  },
];

function readTimeFor(content: string) {
  const words = content.replace(/[#*`|>-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(3, Math.ceil(words / 200))} min read`;
}

export default async function BlogList() {
  const session = await getServerSession(authOptions);
  const dir = path.join(process.cwd(), 'content/blog');
  const posts: Post[] = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((filename) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, filename), 'utf8'));
      return {
        slug: filename.replace('.md', ''),
        readingTime: readTimeFor(content),
        ...data,
      } as Post;
    });

  const bySlug = (slug: string) => posts.find((p) => p.slug === slug);
  const orderedSlugs = [
    ...PATHS.map((p) => p.slug),
    'video-saver-for-skool-vs-downloader-for-skool',
    'video-saver-for-skool-vs-skool-video-download-tools',
    'is-it-legal-to-download-skool-videos',
  ];
  const ordered = orderedSlugs.map(bySlug).filter(Boolean) as Post[];
  const rest = posts.filter((p) => !orderedSlugs.includes(p.slug));
  const allOrdered = [...ordered, ...rest];

  const pillar = bySlug('how-to-download-skool-videos');
  const lastUpdated = posts
    .map((p) => String(p.lastUpdated || p.date || ''))
    .filter(Boolean)
    .sort()
    .pop();

  const comparisons = allOrdered.filter((p) => p.category === 'Comparisons');
  const legalFaq = allOrdered.filter((p) => p.category !== 'Comparisons' && !PATHS.some((x) => x.slug === p.slug));

  const loginButton = session
    ? `<a href="/dashboard"><button class="button button--secondary button--small">Dashboard</button></a>`
    : `<a href="/login"><button class="button button--secondary button--small">Login</button></a>`;
  const getItNowButton = session
    ? `<a href="/dashboard" target="_blank"><button class="button button--primary button--small">Get It Now</button></a>`
    : `<a href="${CHROME_STORE_URL}" target="_blank" rel="noopener noreferrer"><button class="button button--primary button--small">Get It Now</button></a>`;

  const schemas = [
    blogCollectionSchema(allOrdered as any, lastUpdated),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
    ]),
  ];

  return (
    <div className="page-blog-list">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schemas) }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .page-blog-list { background:#f6f5f1; color:#0f172a; }
        .hub-wrap { max-width:1120px; margin:0 auto; padding:0 20px; }
        .hub-hero { position:relative; overflow:hidden; padding:72px 0 64px; color:#fff; background:linear-gradient(135deg,#061640,#0b2a7a 60%,#2a1b86); }
        .hub-hero::before { content:""; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px); background-size:46px 46px; -webkit-mask-image:radial-gradient(ellipse at 75% 0%,#000 10%,transparent 70%); mask-image:radial-gradient(ellipse at 75% 0%,#000 10%,transparent 70%); pointer-events:none; }
        .hub-hero::after { content:""; position:absolute; right:-160px; top:-200px; width:640px; height:640px; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,.55),transparent 66%); pointer-events:none; }
        .hub-hero .hub-wrap { position:relative; z-index:1; }
        .hub-hero-grid { display:grid; grid-template-columns:1.1fr .9fr; gap:40px; align-items:center; }
        .hub-eyebrow { display:inline-block; font-size:.8rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#0b1220; background:#9cc2ff; padding:5px 12px; border-radius:999px; margin-bottom:16px; }
        .hub-hero h1 { font-size:clamp(2.1rem,4.2vw,3.25rem); font-weight:800; line-height:1.1; letter-spacing:-.03em; margin:0 0 16px; color:#fff; }
        .hub-lede { font-size:1.125rem; line-height:1.65; color:rgba(255,255,255,.82); margin:0 0 24px; max-width:560px; }
        .hub-actions { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
        .hub-btn { display:inline-block; background:#0b63ff; color:#fff; font-weight:700; padding:13px 22px; border-radius:12px; text-decoration:none; transition:background .2s, transform .2s; }
        .hub-btn:hover { background:#094fcc; transform:translateY(-1px); }
        .hub-btn-ghost { display:inline-block; font-weight:600; color:#fff; padding:13px 6px; text-decoration:none; }
        .hub-btn-ghost:hover { color:#9cc2ff; }
        .hub-facts { display:flex; flex-wrap:wrap; gap:8px 20px; margin:26px 0 0; padding:0; list-style:none; font-size:.9rem; color:rgba(255,255,255,.8); }
        .hub-facts li::before { content:"\\2713"; color:#9cc2ff; font-weight:800; margin-right:7px; }
        .hub-start { background:#fff; color:#0f172a; border-radius:24px; padding:28px; box-shadow:0 28px 70px rgba(0,0,0,.35); position:relative; }
        .hub-start-tag { font-size:.75rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#0a4fc4; }
        .hub-start h2 { font-size:1.45rem; line-height:1.25; margin:8px 0 10px; font-weight:800; }
        .hub-start p { color:#475569; line-height:1.6; margin:0 0 16px; font-size:.98rem; }
        .hub-start ol { list-style:none; margin:0 0 20px; padding:0; counter-reset:s; display:grid; gap:10px; }
        .hub-start li { counter-increment:s; display:flex; gap:12px; align-items:flex-start; font-size:.95rem; color:#334155; }
        .hub-start li::before { content:counter(s); flex:0 0 26px; height:26px; border-radius:50%; background:#dbe8ff; color:#0b63ff; font-weight:800; font-size:.8rem; display:flex; align-items:center; justify-content:center; }
        .hub-link { font-weight:700; color:#0a4fc4; text-decoration:none; }
        .hub-link:hover { text-decoration:underline; }
        .hub-section { padding:56px 0 8px; }
        .hub-section h2 { font-size:1.75rem; font-weight:800; letter-spacing:-.015em; margin:0 0 8px; }
        .hub-sub { color:#64748b; margin:0 0 28px; font-size:1.03rem; max-width:640px; line-height:1.6; }
        .hub-paths { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .hub-path { display:flex; flex-direction:column; background:#fff; border:1px solid #e7e5df; border-radius:20px; padding:22px; text-decoration:none; color:inherit; transition:transform .2s, box-shadow .2s, border-color .2s; }
        .hub-path { border-top:4px solid #0b63ff; }
        .hub-path:nth-child(3n+2) { border-top-color:#7c3aed; }
        .hub-path:nth-child(3n) { border-top-color:#059669; }
        .hub-path:hover { transform:translateY(-3px); box-shadow:0 14px 34px rgba(15,23,42,.09); border-color:#c7d7f5; }
        .hub-path-tag { align-self:flex-start; font-size:.72rem; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:#475569; background:#f1efe9; padding:4px 10px; border-radius:999px; margin-bottom:14px; }
        .hub-path h3 { font-size:1.15rem; font-weight:800; line-height:1.3; margin:0 0 8px; }
        .hub-path p { color:#475569; font-size:.95rem; line-height:1.6; margin:0 0 16px; flex:1; }
        .hub-path-meta { display:flex; justify-content:space-between; font-size:.85rem; color:#64748b; border-top:1px solid #efede7; padding-top:12px; }
        .hub-path-meta strong { color:#0b63ff; }
        .hub-list { background:#fff; border:1px solid #e7e5df; border-radius:20px; overflow:hidden; }
        .hub-row { display:grid; grid-template-columns:1fr auto; gap:16px; align-items:center; padding:20px 24px; text-decoration:none; color:inherit; border-bottom:1px solid #efede7; transition:background .15s; }
        .hub-row:last-child { border-bottom:0; }
        .hub-row:hover { background:#f8faff; }
        .hub-row h3 { font-size:1.05rem; font-weight:700; margin:0 0 4px; line-height:1.35; }
        .hub-row p { margin:0; color:#64748b; font-size:.92rem; line-height:1.55; }
        .hub-row-meta { text-align:right; font-size:.82rem; color:#64748b; white-space:nowrap; }
        .hub-row-meta strong { display:block; color:#0b63ff; margin-top:4px; }
        .hub-faq { display:grid; gap:10px; max-width:820px; }
        .hub-faq details { background:#fff; border:1px solid #e7e5df; border-radius:14px; padding:0 20px; }
        .hub-faq summary { cursor:pointer; font-weight:700; padding:18px 0; list-style:none; display:flex; justify-content:space-between; gap:12px; }
        .hub-faq summary::-webkit-details-marker { display:none; }
        .hub-faq summary::after { content:"+"; font-size:1.3rem; color:#0b63ff; line-height:1; }
        .hub-faq details[open] summary::after { content:"\\2212"; }
        .hub-faq details p { margin:0 0 18px; color:#475569; line-height:1.65; }
        .hub-faq a { color:#0b63ff; font-weight:600; }
        .hub-standards { margin:56px 0 0; padding:22px 26px; background:#fff; border:1px solid #e7e5df; border-left:4px solid #0b63ff; border-radius:14px; color:#475569; line-height:1.65; font-size:.95rem; }
        .hub-standards strong { color:#0f172a; }
        .hub-standards a { color:#0b63ff; font-weight:600; }
        .hub-cta { margin:56px 0 72px; background:#0f172a; border-radius:28px; padding:48px 32px; text-align:center; color:#fff; }
        .hub-cta h2 { font-size:1.9rem; font-weight:800; margin:0 0 10px; color:#fff; }
        .hub-cta p { color:#cbd5e1; max-width:560px; margin:0 auto 24px; line-height:1.6; }
        .hub-cta .hub-btn { margin:0 6px 8px; }
        .hub-cta .hub-btn-alt { background:transparent; border:1px solid #ffffff40; }
        .hub-cta .hub-btn-alt:hover { background:#ffffff14; }
        @media (max-width:960px) { .hub-hero-grid { grid-template-columns:1fr; } .hub-paths { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:600px) { .hub-hero { padding:44px 0 28px; } .hub-paths { grid-template-columns:1fr; } .hub-row { grid-template-columns:1fr; } .hub-row-meta { text-align:left; } .hub-cta { padding:36px 20px; border-radius:22px; } }
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
          <section className="hub-hero">
            <div className="hub-wrap hub-hero-grid">
              <div>
                <span className="hub-eyebrow">Guides{lastUpdated ? ` · Updated ${lastUpdated}` : ''}</span>
                <h1>Skool Video Downloader Guides &amp; Comparisons</h1>
                <p className="hub-lede">
                  How to save Skool lessons and community replays as MP4 files, how the available tools differ, and what the rules are. Written by the team behind Video Saver for Skool, so product claims are labelled as ours.
                </p>
                <div className="hub-actions">
                  <a className="hub-btn" href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">Add to Chrome - 5 free downloads</a>
                  <a className="hub-btn-ghost" href="#paths">Find the right guide ↓</a>
                </div>
                <ul className="hub-facts">
                  <li>Skool native, YouTube, Loom, Vimeo, Wistia</li>
                  <li>Processed locally in your browser</li>
                  <li>14-day refund</li>
                </ul>
              </div>
              {pillar && (
                <aside className="hub-start" aria-label="Start here">
                  <span className="hub-start-tag">Start here</span>
                  <h2>{pillar.title}</h2>
                  <p>{pillar.description}</p>
                  <ol>
                    <li>Install the extension and sign in</li>
                    <li>Open the lesson or community post</li>
                    <li>Click Download on the video</li>
                    <li>Choose a quality and save the MP4</li>
                  </ol>
                  <Link className="hub-link" href={`/blog/${pillar.slug}`}>Read the full guide →</Link>
                </aside>
              )}
            </div>
          </section>

          <div className="hub-wrap">
            <section className="hub-section" id="paths" aria-labelledby="paths-h">
              <h2 id="paths-h">What do you want to do?</h2>
              <p className="hub-sub">Pick the goal closest to yours. Each guide answers one question in full.</p>
              <div className="hub-paths">
                {PATHS.map((p) => {
                  const post = bySlug(p.slug);
                  if (!post) return null;
                  return (
                    <Link key={p.slug} href={`/blog/${p.slug}`} className="hub-path">
                      <span className="hub-path-tag">{p.tag}</span>
                      <h3>{p.goal}</h3>
                      <p>{p.blurb}</p>
                      <div className="hub-path-meta">
                        <span>{post.readingTime}</span>
                        <strong>Read guide →</strong>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="hub-section" aria-labelledby="cmp-h">
              <h2 id="cmp-h">Tool comparisons</h2>
              <p className="hub-sub">Competitor details come from each tool&apos;s public Chrome Web Store listing, checked on the date shown in each article. We make Video Saver for Skool, so read these with that in mind.</p>
              <div className="hub-list">
                {comparisons.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="hub-row">
                    <div>
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                    </div>
                    <div className="hub-row-meta">
                      {p.readingTime}
                      <strong>Read →</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {legalFaq.length > 0 && (
              <section className="hub-section" aria-labelledby="rules-h">
                <h2 id="rules-h">Rules and responsible use</h2>
                <p className="hub-sub">Before you download, know where personal study ends and redistribution begins.</p>
                <div className="hub-list">
                  {legalFaq.map((p) => (
                    <Link key={p.slug} href={`/blog/${p.slug}`} className="hub-row">
                      <div>
                        <h3>{p.title}</h3>
                        <p>{p.description}</p>
                      </div>
                      <div className="hub-row-meta">
                        {p.readingTime}
                        <strong>Read →</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="hub-section" aria-labelledby="faq-h">
              <h2 id="faq-h">Quick answers</h2>
              <p className="hub-sub">The short versions. Each links to the full guide.</p>
              <div className="hub-faq">
                {QUICK_ANSWERS.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>

            <p className="hub-standards">
              <strong>Editorial standards.</strong> Facts about Video Saver for Skool are checked against the current extension, pricing page and refund policy. Facts about other tools come from their public listings or project pages. Each article shows when it was last reviewed. Found a mistake? Email <a href="mailto:hello@skoolvideosaver.com">hello@skoolvideosaver.com</a>.
            </p>

            <section className="hub-cta" aria-label="Install the extension">
              <h2>Save your Skool lessons as MP4</h2>
              <p>Test it on your own lessons with 5 free downloads. No credit card required. After that, $20/month or a one-time Lifetime Pro plan.</p>
              <a className="hub-btn" href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">Add to Chrome - 5 free downloads</a>
              <a className="hub-btn hub-btn-alt" href="/#pricing">See pricing</a>
            </section>
          </div>
        </main>

        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-features">
              <h4 className="footer-section-title" aria-level={3}>Guides</h4>
              <div className="footer-features-grid">
                {allOrdered.map((p) => (
                  <a key={p.slug} className="footer-feature-link" href={`/blog/${p.slug}`}>
                    {PATHS.find((x) => x.slug === p.slug)?.goal || p.title}
                  </a>
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
