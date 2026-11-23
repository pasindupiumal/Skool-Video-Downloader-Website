import React from 'react';
import { CHROME_STORE_URL, SITE_NAME } from "@/lib/site";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <link rel="stylesheet" href="/assets/css/dmca.css" />
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
          <div className="blog-layout" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <article className="blog-article">
              <div className="blog-article-content">
                <h1 className="blog-article-title" style={{ marginBottom: '16px' }}>Page not found</h1>
                <p className="blog-paragraph">
                  Sorry, the page you are looking for does not exist or may have moved.
                </p>
                <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a href="/" className="button button--primary">Back to Home</a>
                  <a href="/blog" className="button button--secondary">Browse Guides</a>
                </div>
              </div>
            </article>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
