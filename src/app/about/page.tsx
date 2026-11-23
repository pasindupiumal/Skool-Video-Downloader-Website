import React from 'react';
import type { Metadata } from 'next';
import { AUTHOR } from "@/lib/author";
import {
  CHROME_STORE_URL,
  DISCORD_INVITE_URL,
  FREE_DOWNLOADS,
  LIFETIME_PRICE,
  MONTHLY_PRICE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import { aboutPageSchema, jsonLd } from "@/lib/seo";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: `About ${SITE_NAME} | Independent Skool Video Downloader`,
  description: `Learn who builds ${SITE_NAME} (${AUTHOR.name}), how local browser MP4 saving works across Chrome, Edge, Brave, and Opera, our pricing ($${MONTHLY_PRICE}/mo or $${LIFETIME_PRICE} one-time), and support.`,
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: `${SITE_URL}/about`,
    title: `About ${SITE_NAME} | Independent Chrome Extension`,
    description: `Built by ${AUTHOR.name}. Saves Skool lessons locally in your browser with ${FREE_DOWNLOADS} downloads in total on the free trial. Not affiliated with Skool.`,
    images: [{ url: `${SITE_URL}/opengraph-image.jpg`, width: 1200, height: 630, alt: SITE_NAME }],
  },
};

export default function AboutPage() {
  return (
    <>
      <link rel="stylesheet" href="/assets/css/dmca.css" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(aboutPageSchema()) }} />

      <div className="page-index site-layout">
        <header className="index-header">
          <div className="header-container">
            <a className="header-logo" href="/">
              <img src="/assets/images/img_a38993e738.webp" height={30} width={30} alt="Video Saver for Skool Logo" />
              <span>{SITE_NAME}</span>
            </a>
            <nav className="header-nav">
              <a href="/#features">Features</a>
              <a href="/#pricing">Pricing</a>
              <a href="/blog">Guides</a>
            </nav>
            <div className="header-actions">
              <a href="/login">
                <button className="button button--secondary button--small">Login</button>
              </a>
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
                <button className="button button--primary button--small">Get It Now</button>
              </a>
            </div>
          </div>
        </header>

        <main className="site-main">
          <div className="blog-layout">
            <article className="blog-article">
              <a className="blog-back-link" href="/">← Back to Home</a>

              <header className="blog-article-header">
                <h1 className="blog-article-title">About {SITE_NAME}</h1>
                <div className="blog-article-meta">
                  <time dateTime="2026-11-23">Updated: November 23, 2026</time>
                </div>
              </header>

              <div className="blog-article-content">
                <p className="blog-paragraph">
                  <strong className="blog-strong">{SITE_NAME}</strong> is an independent desktop browser extension built by{' '}
                  <a className="blog-link" href={AUTHOR.url} target="_blank" rel="noopener noreferrer">{AUTHOR.name}</a>{' '}
                  for students who want to archive Skool classroom lessons and community post videos for personal offline study.
                  It runs locally in your browser and is not affiliated with Skool.
                </p>

                <h2 className="blog-h2">Quick Facts</h2>
                <ul className="blog-paragraph" style={{ paddingLeft: '20px' }}>
                  <li><strong className="blog-strong">Product name:</strong> {SITE_NAME} (also searched as Skool Video Saver or Skool Video Downloader)</li>
                  <li><strong className="blog-strong">Developer:</strong> {AUTHOR.name} ({AUTHOR.jobTitle})</li>
                  <li><strong className="blog-strong">Supported browsers:</strong> Chrome, Edge, Brave, and Opera (Windows, macOS, Linux)</li>
                  <li><strong className="blog-strong">Supported players:</strong> Skool native player (Mux/HLS), YouTube, Loom, Vimeo, and Wistia embeds</li>
                  <li><strong className="blog-strong">Video processing:</strong> Local inside your browser — videos are never uploaded to our servers</li>
                  <li><strong className="blog-strong">Pricing:</strong> {FREE_DOWNLOADS} downloads in total free trial, then ${MONTHLY_PRICE}/month or ${LIFETIME_PRICE} one-time Lifetime Pro (14-day refund policy)</li>
                  <li><strong className="blog-strong">Support:</strong> <a className="blog-link" href="mailto:hello@skoolvideosaver.com">hello@skoolvideosaver.com</a> and <a className="blog-link" href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">Discord</a></li>
                </ul>

                <h2 className="blog-h2">Who Builds {SITE_NAME}</h2>
                <p className="blog-paragraph">
                  {AUTHOR.bio} You can find his work on{' '}
                  <a className="blog-link" href={AUTHOR.url} target="_blank" rel="noopener noreferrer">pasindupiumal.com</a>,{' '}
                  <a className="blog-link" href={AUTHOR.github} target="_blank" rel="noopener noreferrer">GitHub</a>, and{' '}
                  <a className="blog-link" href={AUTHOR.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>.
                  The extension is distributed via the{' '}
                  <a className="blog-link" href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">Chrome Web Store</a>.
                </p>

                <h2 className="blog-h2">How It Works &amp; Privacy</h2>
                <p className="blog-paragraph">
                  When you open a Skool lesson or community post you already have permission to watch, the extension detects the active video player and converts the stream to an MP4 file directly on your computer. We do not track your Skool browsing history or store your downloaded videos on external servers. Read the full <a className="blog-link" href="/privacy">Privacy Policy</a> for details on license verification.
                </p>

                <h2 className="blog-h2">Independent Product &amp; Non-Affiliation</h2>
                <p className="blog-paragraph">
                  {SITE_NAME} is an independent software product. It is <strong className="blog-strong">not affiliated with, endorsed by, or sponsored by Skool.com</strong>, nor is it affiliated with third-party extensions such as Downloader for Skool (serp.co) or Skool Video Download Tools (Allen Five Holdings LLC / A5). Intended strictly for personal offline study of content you are authorized to access; see our <a className="blog-link" href="/terms">Terms of Service</a> and <a className="blog-link" href="/dmca">DMCA Policy</a>.
                </p>

                <h2 className="blog-h2">Contact &amp; Resources</h2>
                <p className="blog-paragraph">
                  Need help with a lesson, license, or refund? Email{' '}
                  <a className="blog-link" href="mailto:hello@skoolvideosaver.com">hello@skoolvideosaver.com</a>, use the{' '}
                  <a className="blog-link" href="/contact">contact form</a>, or join our{' '}
                  <a className="blog-link" href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">Discord community</a>.
                  You can also browse our <a className="blog-link" href="/blog">guides &amp; tutorials</a>,{' '}
                  <a className="blog-link" href="/refund-policy">14-day refund policy</a>, or{' '}
                  <a className="blog-link" href="/pricing.md">markdown pricing sheet</a>.
                </p>
              </div>
            </article>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
