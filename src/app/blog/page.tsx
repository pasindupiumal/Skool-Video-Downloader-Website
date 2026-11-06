import React from 'react';
import { CHROME_STORE_URL } from "@/lib/site";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: 'Blog | Video Saver for Skool',
  description: 'Latest guides and strategies for Skool community growth and video archival.',
};

export default async function BlogList() {
  const session = await getServerSession(authOptions);
  const postsDirectory = path.join(process.cwd(), 'content/blog');
  const filenames = fs.readdirSync(postsDirectory);

  const posts: any[] = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // Estimate reading time
    const wordsPerMinute = 200;
    const noOfWords = content.split(/\s/g).length;
    const minutes = Math.ceil(noOfWords / wordsPerMinute);
    
    return {
      slug: filename.replace('.md', ''),
      readingTime: `${minutes} min read`,
      ...data,
    };
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);
  const categories = Array.from(new Set(posts.map((p: any) => p.category || 'Guides')));

  const loginButton = session 
    ? `<a href="/dashboard"><button class="button button--secondary button--small">Dashboard</button></a>`
    : `<a href="/login"><button class="button button--secondary button--small">Login</button></a>`;
    
  const getItNowButton = session
    ? `<a href="/dashboard" target="_blank"><button class="button button--primary button--small">Get It Now</button></a>`
    : `<a href="${CHROME_STORE_URL}" target="_blank"><button class="button button--primary button--small">Get It Now</button></a>`;

  return (
    <div className="page-blog-list">
      <link rel="stylesheet" href="/assets/css/image-replacer.css" />
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-hero {
          padding: 100px 20px 60px;
          background: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
          text-align: center;
        }
        .blog-hero h1 {
          font-size: 4rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #111827 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .category-pill {
          display: inline-block;
          padding: 8px 20px;
          border-radius: 99px;
          background: white;
          border: 1px solid #E5E7EB;
          color: #4B5563;
          font-weight: 500;
          font-size: 0.9rem;
          margin: 0 6px 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .category-pill:hover {
          border-color: #10b981;
          color: #10b981;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .category-pill.active {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }
        .featured-card {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 0;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid #F3F4F6;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
          margin-bottom: 60px;
          transition: transform 0.3s ease;
        }
        .featured-card:hover {
          transform: translateY(-4px);
        }
        .featured-image {
          background: #f3f4f6 url('/assets/images/img_a4cd805418.png') no-repeat center center;
          background-size: cover;
          min-height: 400px;
        }
        .featured-content {
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 40px;
          margin-bottom: 80px;
        }
        .blog-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #F3F4F6;
          transition: all 0.3s ease;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
        }
        .blog-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .blog-card-image {
          height: 240px;
          background: #F9FAFB;
          position: relative;
          overflow: hidden;
        }
        .blog-card-image img, .blog-card-image video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .blog-card:hover .blog-card-image video {
          transform: scale(1.05);
        }
        .blog-card-content {
          padding: 30px;
          flex: 1;
        }
        .newsletter-section {
          background: #111827;
          border-radius: 32px;
          padding: 80px;
          text-align: center;
          color: white;
          margin-bottom: 80px;
          position: relative;
          overflow: hidden;
        }
        .newsletter-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
        }
        .newsletter-input {
          padding: 16px 24px;
          border-radius: 12px;
          border: 1px solid #374151;
          background: #1F2937;
          color: white;
          width: 300px;
          margin-right: 12px;
          font-size: 1rem;
        }
        @media (max-width: 1024px) {
          .featured-card { grid-template-columns: 1fr; }
          .blog-hero h1 { font-size: 3rem; }
        }
      ` }} />

      <div className="page-index site-layout">
        <header className="index-header">
          <div className="header-container">
            <a className="header-logo" href="/">
              <img src="/assets/images/img_a38993e738.png" height="30" width="30" alt="Video Saver for Skool Logo" />
              <span>Video Saver for Skool</span>
            </a>
            <nav className="header-nav">
              <a href="/#features">Features</a>
              <a href="/#reviews">Reviews</a>
              <a href="/#pricing">Pricing</a>
            </nav>
            <div className="header-actions" dangerouslySetInnerHTML={{ __html: loginButton + getItNowButton }} />
          </div>
        </header>

        <section className="blog-hero">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1>Video Saver for Skool Blog</h1>
            <p style={{ fontSize: '1.25rem', color: '#6B7280', marginBottom: '32px' }}>
              Guides and tips for saving, organizing, and watching your Skool videos offline.
            </p>
            <div className="categories">
              <a href="/blog" className="category-pill active">All Articles</a>
              {categories.map(cat => (
                <a key={cat} href={`/blog?category=${cat.toLowerCase()}`} className="category-pill">{cat}</a>
              ))}
            </div>
          </div>
        </section>

        <main className="site-main" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          {featuredPost && (
            <Link href={`/blog/${featuredPost.slug}`} className="featured-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="featured-image" style={{ background: '#000', overflow: 'hidden' }}><video src="/assets/videos/demo.mp4#t=0.001" preload="metadata" muted playsInline tabIndex={-1} aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} /></div>
              <div className="featured-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 12px', borderRadius: '99px', fontSize: '0.875rem', fontWeight: '600' }}>
                    FEATURED
                  </span>
                  <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>{featuredPost.date}</span>
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '20px' }}>{featuredPost.title}</h2>
                <p style={{ fontSize: '1.125rem', color: '#4B5563', lineHeight: '1.6', marginBottom: '32px' }}>{featuredPost.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee' }}></div>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{featuredPost.author || 'Editorial Team'}</span>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>Read Article →</span>
                </div>
              </div>
            </Link>
          )}

          <div className="blog-grid">
            {otherPosts.map((post: any) => (
              <Link href={`/blog/${post.slug}`} key={post.slug} className="blog-card">
                <div className="blog-card-image">
                  <video src="/assets/videos/demo.mp4#t=0.001" preload="metadata" muted playsInline tabIndex={-1} aria-label={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                </div>
                <div className="blog-card-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {post.category || 'GUIDE'}
                    </span>
                    <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>{post.readingTime}</span>
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.4', marginBottom: '16px', color: '#111827' }}>
                    {post.title}
                  </h3>
                  <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px' }}>
                    {post.description}
                  </p>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>{post.date}</span>
                    <span style={{ color: '#111827', fontWeight: '600' }}>Read Guide →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <section className="newsletter-section">
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>Get new Skool video guides</h2>
            <p style={{ fontSize: '1.25rem', color: '#9CA3AF', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              Be the first to hear about new tutorials and Video Saver for Skool updates.
            </p>
            <form style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <input type="email" placeholder="Enter your email" className="newsletter-input" required />
              <button type="submit" className="button button--primary" style={{ padding: '16px 32px' }}>Subscribe Now</button>
            </form>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', marginTop: '20px' }}>Zero spam. Unsubscribe at any time.</p>
          </section>
        </main>

        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-features">
              <h4 className="footer-section-title">Features</h4>
              <div className="footer-features-grid">
                <a className="footer-feature-link" href="/#features">Video Saver for Skool</a>
                <a className="footer-feature-link" href="/#features">Loom Video Downloader</a>
                <a className="footer-feature-link" href="/#features">Vimeo Video Downloader</a>
                <a className="footer-feature-link" href="/#features">Wistia Video Downloader</a>
                <a className="footer-feature-link" href="/#features">Native Skool Player</a>
                <a className="footer-feature-link" href="/#features">HLS to MP4 Conversion</a>
                <a className="footer-feature-link" href="/#features">Live Download Progress</a>
                <a className="footer-feature-link" href="/#features">Local, Private Processing</a>
                <a className="footer-feature-link" href="/#pricing">Lifetime License</a>
                <a className="footer-feature-link" href="/#pricing">Monthly Plan</a>
                <a className="footer-feature-link" href="/dashboard">Your Dashboard</a>
                <a className="footer-feature-link" href="/blog">Guides &amp; Tutorials</a>
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
                <a href="/contact">Contact</a>
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
                <a href="/refund-policy">Refund</a>
                <a href="/dmca">DMCA</a>
              </div>
              <div className="footer-meta">
                <span>Version 2.3.0</span>
                <span className="footer-separator">•</span>
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
