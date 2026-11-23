import React from 'react';
import './site-footer.css';
import { CHROME_STORE_URL, DISCORD_INVITE_URL, SITE_NAME } from '@/lib/site';

export default function SiteFooter() {
  return (
    <footer className="sf-footer">
      <div className="sf-inner">
        <div className="sf-grid">
          <div className="sf-brand-col">
            <a className="sf-brand-link" href="/">
              <img
                src="/assets/images/img_a38993e738.webp"
                width={28}
                height={28}
                alt="Video Saver for Skool logo"
                className="sf-logo"
              />
              <span>{SITE_NAME}</span>
            </a>
            <p className="sf-desc">
              Save Skool classroom lessons and community replays as private MP4 files locally in your browser.
            </p>
            <a className="sf-email" href="mailto:hello@skoolvideosaver.com">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>hello@skoolvideosaver.com</span>
            </a>
            <div className="sf-socials">
              <a
                className="sf-pill"
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={15}
                  height={15}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
                <span>Discord</span>
              </a>
              <a
                className="sf-pill"
                href="https://x.com/skoolvideosaver"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow @skoolvideosaver on X"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z" />
                </svg>
                <span>@skoolvideosaver</span>
              </a>
            </div>
          </div>

          <nav className="sf-col" aria-label="Product">
            <p className="sf-col-title">Product</p>
            <ul className="sf-list">
              <li><a href="/#features">Features</a></li>
              <li><a href="/#pricing">Pricing</a></li>
              <li><a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">Install Chrome extension</a></li>
              <li><a href="/dashboard">Account dashboard</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>

          <nav className="sf-col" aria-label="Guides">
            <p className="sf-col-title">Guides</p>
            <ul className="sf-list">
              <li><a href="/blog">All guides</a></li>
              <li><a href="/blog/how-to-download-skool-videos">How to download Skool videos</a></li>
              <li><a href="/blog/download-skool-videos-free">5 free downloads guide</a></li>
              <li><a href="/blog/download-loom-videos-from-skool">Download Loom from Skool</a></li>
              <li><a href="/blog/save-skool-course-before-membership-expires">Save a course before expiry</a></li>
              <li><a href="/blog/skool-video-downloader-alternatives">Tool alternatives compared</a></li>
              <li><a href="/blog/is-it-legal-to-download-skool-videos">Is it legal to download?</a></li>
            </ul>
          </nav>

          <nav className="sf-col" aria-label="Support and legal">
            <p className="sf-col-title">Support &amp; legal</p>
            <ul className="sf-list">
              <li><a href="/contact">Contact support</a></li>
              <li><a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">Discord community</a></li>
              <li><a href="/privacy">Privacy policy</a></li>
              <li><a href="/terms">Terms of service</a></li>
              <li><a href="/refund-policy">14-day refund policy</a></li>
              <li><a href="/dmca">DMCA &amp; removal</a></li>
            </ul>
          </nav>
        </div>

        <div className="sf-bottom">
          <p>© 2026 {SITE_NAME}. Independent browser extension, not affiliated with Skool.</p>
          <p>Chrome, Edge, Brave &amp; Opera</p>
        </div>
      </div>
    </footer>
  );
}
