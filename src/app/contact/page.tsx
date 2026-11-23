import React from 'react';
import { CHROME_STORE_URL, DISCORD_INVITE_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { jsonLd, webPageSchema } from "@/lib/seo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import "@/styles/shell.css";
import "./contact.css";
import SiteFooter from "@/components/SiteFooter";
import ContactFormEnhancer from "./contact-form-enhancer";

export const metadata = {
  title: 'Contact Video Saver for Skool - Support & Questions',
  description: 'Questions about downloading Skool videos or your license? Contact the Video Saver for Skool team at hello@skoolvideosaver.com.',
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: `${SITE_URL}/contact`,
    title: 'Contact Video Saver for Skool - Support & Questions',
    description: 'Questions about downloading Skool videos or your license? Contact the Video Saver for Skool team at hello@skoolvideosaver.com.',
    images: [{ url: `${SITE_URL}/opengraph-image.jpg`, width: 1200, height: 630, alt: SITE_NAME }],
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  const actionHref = session ? '/dashboard' : CHROME_STORE_URL;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(webPageSchema({ path: '/contact', name: 'Contact', type: 'ContactPage' })),
        }}
      />

      <div className="page-index site-layout ct-page">
        <header className="index-header">
          <div className="header-container">
            <a className="header-logo" href="/">
              <img
                src="/assets/images/img_a38993e738.webp"
                height={30}
                width={30}
                alt="Video Saver for Skool Logo"
              />
              <span>{SITE_NAME}</span>
            </a>
            <nav className="header-nav">
              <a href="/#features">Features</a>
              <a href="/#pricing">Pricing</a>
              <a href="/blog">Guides</a>
            </nav>
            <div className="header-actions">
              {session ? (
                <a href="/dashboard">
                  <button className="button button--secondary button--small">Dashboard</button>
                </a>
              ) : (
                <a href="/login">
                  <button className="button button--secondary button--small">Login</button>
                </a>
              )}
              <a
                href={actionHref}
                target="_blank"
                rel={session ? undefined : 'noopener noreferrer'}
              >
                <button className="button button--primary button--small">Get It Now</button>
              </a>
            </div>
          </div>
        </header>

        <main className="ct-main">
          <section className="ct-hero">
            <div className="ct-wrap">
              <nav className="ct-crumbs" aria-label="Breadcrumb">
                <a href="/">Home</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Contact</span>
              </nav>
              <h1>Contact support</h1>
              <p>
                Questions about saving Skool videos, activating a license key, or requesting a refund? Send a note below or reach us directly.
              </p>
            </div>
          </section>

          <section className="ct-body">
            <div className="ct-wrap ct-grid">
              <div className="ct-form-card">
                <h2>Send a message</h2>
                <p className="ct-form-sub">
                  Include the Skool player type or your account email if it is a download or license question.
                </p>

                <form className="contact-form ct-form" action="/api/contact" method="POST">
                  <div className="ct-row">
                    <div className="ct-field">
                      <label htmlFor="name">Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="ct-field">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="ct-field">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      placeholder="License key, refund, or video question"
                    />
                  </div>

                  <div className="ct-field">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Tell us how we can help..."
                      rows={5}
                      required
                    />
                  </div>

                  <button type="submit" className="button button--primary ct-submit">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1={22} y1={2} x2={11} y2={13} />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>Send message</span>
                  </button>
                </form>

                <div className="ct-sla">
                  <span className="ct-sla-dot" aria-hidden="true" />
                  <span>We typically reply within 24 hours on business days.</span>
                </div>
              </div>

              <aside className="ct-sidebar" aria-label="Other support channels">
                <div className="ct-panel">
                  <h2>Direct channels</h2>
                  <div className="ct-channels">
                    <a href="mailto:hello@skoolvideosaver.com" className="ct-channel">
                      <div className="ct-channel-icon ct-channel-icon--email" aria-hidden="true">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={20}
                          height={20}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div className="ct-channel-body">
                        <strong>Email support</strong>
                        <span className="ct-channel-desc">Account, billing, and refund requests</span>
                        <span className="ct-channel-value">hello@skoolvideosaver.com</span>
                      </div>
                    </a>

                    <a
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-channel"
                    >
                      <div className="ct-channel-icon ct-channel-icon--discord" aria-hidden="true">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={20}
                          height={20}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                        </svg>
                      </div>
                      <div className="ct-channel-body">
                        <strong>Discord community</strong>
                        <span className="ct-channel-desc">Fastest for video troubleshooting and quick questions</span>
                        <span className="ct-channel-value">Join Discord server</span>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="ct-panel ct-panel--muted">
                  <h2>Common requests</h2>
                  <div className="ct-quick-list">
                    <a href="/refund-policy" className="ct-quick-link">
                      <strong>14-day refund</strong>
                      <span>No-questions-asked refund within 14 days of purchase.</span>
                    </a>
                    <a href="/blog/how-to-download-skool-videos" className="ct-quick-link">
                      <strong>Video not detected?</strong>
                      <span>Step-by-step setup and troubleshooting for Skool players.</span>
                    </a>
                    <a href="/dmca" className="ct-quick-link">
                      <strong>Course creator or DMCA</strong>
                      <span>Rights holder inquiries and removal request process.</span>
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
      <ContactFormEnhancer />
    </>
  );
}
