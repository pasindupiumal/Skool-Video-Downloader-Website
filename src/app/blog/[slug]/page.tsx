import React from 'react';
import { CHROME_STORE_URL } from "@/lib/site";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DemoVideo from "@/components/DemoVideo";

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const postsDirectory = path.join(process.cwd(), 'content/blog');
  const filePath = path.join(postsDirectory, `${params.slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  const { data, content } = matter(fileContents);
  
  const processedContent = await remark()
    .use(html)
    .process(content);
  const contentHtml = processedContent.toString();

  const loginButton = session 
    ? `<a href="/dashboard"><button class="button button--secondary button--small">Dashboard</button></a>`
    : `<a href="/login"><button class="button button--secondary button--small">Login</button></a>`;
    
  const getItNowButton = session
    ? `<a href="/dashboard" target="_blank"><button class="button button--primary button--small">Get It Now</button></a>`
    : `<a href="${CHROME_STORE_URL}" target="_blank"><button class="button button--primary button--small">Get It Now</button></a>`;

  return (
    <div className="page-blog-post">
      <link rel="stylesheet" href="/assets/css/image-replacer.css" />
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

        <main className="site-main">
          <div className="fp-store">
            <div className="fp-store-container">
              <nav className="fp-store-breadcrumb">
                <a href="/blog">Blog</a>
                <span>/</span>
                <span>{data.title}</span>
              </nav>

              <header className="fp-store-header">
                <div className="fp-store-header-left">
                  <div className={`fp-store-icon fp-store-icon--${data.icon || 'media'}`}>
                    <img src="/assets/images/img_a38993e738.png" alt="Video Saver for Skool logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit' }} />
                  </div>
                  <div className="fp-store-header-text">
                    <h1>{data.title}</h1>
                    <div className="fp-store-meta">
                      <span className="fp-store-meta-category">{data.category || 'Guides'}</span>
                      <span className="fp-store-meta-dot"></span>
                      <span className="fp-store-meta-users">{data.users || '4,000+ readers'}</span>
                      <span className="fp-store-meta-dot"></span>
                      <span className="fp-store-meta-rating">
                        <span className="fp-store-stars">
                          {[1, 2, 3, 4].map(i => (
                            <svg key={i} viewBox="0 0 24 24" fill="#F4B400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                          ))}
                          <svg viewBox="0 0 24 24"><defs><linearGradient id="half-star"><stop offset="40%" stopColor="#F4B400"></stop><stop offset="40%" stopColor="#D1D5DB"></stop></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half-star)"></path></svg>
                        </span>
                        <span className="fp-store-rating-text">{data.rating || '4.9'}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="button button--primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="#FFF" d="M128.003 199.216c39.335 0 71.221-31.888 71.221-71.223c0-39.335-31.886-71.223-71.221-71.223c-39.335 0-71.222 31.888-71.222 71.223c0 39.335 31.887 71.223 71.222 71.223Z"></path><path fill="#229342" d="M35.89 92.997c-5.313-9.203-11.558-18.862-18.736-28.977a127.98 127.98 0 0 0 110.857 191.981c11.78-16.523 19.78-28.437 23.996-35.74c8.099-14.028 18.573-34.112 31.423-60.251v-.015a63.993 63.993 0 0 1-110.857.017c-17.453-32.548-29.68-54.887-36.683-67.015Z"></path><path fill="#FBC116" d="M128.008 255.996A127.972 127.972 0 0 0 256 127.997A127.983 127.983 0 0 0 238.837 64c-24.248-2.39-42.143-3.585-53.686-3.585c-13.088 0-32.139 1.195-57.152 3.585l-.014.01a63.993 63.993 0 0 1 55.444 31.987a63.993 63.993 0 0 1-.001 64.01l-55.42 95.989Z"></path><path fill="#1A73E8" d="M128.003 178.677c27.984 0 50.669-22.685 50.669-50.67c0-27.986-22.685-50.67-50.67-50.67c-27.983 0-50.669 22.686-50.669 50.67s22.686 50.67 50.67 50.67Z"></path><path fill="#E33B2E" d="M128.003 64.004H238.84a127.973 127.973 0 0 0-221.685.015l55.419 95.99l.015.008a63.993 63.993 0 0 1 55.415-96.014l-.002.001Z"></path></svg>Install Extension
                </a>
              </header>

              <div className="fp-store-tags">
                <span className="fp-store-tag">Blog</span>
                <span className="fp-store-tag">{data.category || 'Guide'}</span>
                <span className="fp-store-tag">Tutorial</span>
              </div>

              {data.video_url && (
                <div className="fp-store-gallery">
                  <div className="fp-store-carousel-wrapper">
                    <div className="fp-store-carousel">
                      <div className="fp-store-slide active">
                        <DemoVideo />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="fp-store-overview">
                <h2>Overview</h2>
                <div className="fp-store-overview-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
              </div>

              {data.tldr && (
                <div className="fp-store-features">
                  <h2>Key Takeaways</h2>
                  <div dangerouslySetInnerHTML={{ __html: `<p>${data.tldr}</p>` }} />
                </div>
              )}

              <div className="fp-store-cta">
                <h3>Want to save Skool videos?</h3>
                <p>Get started with Video Saver for Skool today and unlock unlimited downloads.</p>
                <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="button button--primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512"><path fill="currentColor" d="M376 160H272v153.37l52.69-52.68a16 16 0 0 1 22.62 22.62l-80 80a16 16 0 0 1-22.62 0l-80-80a16 16 0 0 1 22.62-22.62L240 313.37V160H136a56.06 56.06 0 0 0-56 56v208a56.06 56.06 0 0 0 56 56h240a56.06 56.06 0 0 0 56-56V216a56.06 56.06 0 0 0-56-56ZM272 48a16 16 0 0 0-32 0v112h32Z"></path></svg>
                  Get It Now
                </a>
              </div>
            </div>
          </div>
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
