import React from 'react';
import { CHROME_STORE_URL } from "@/lib/site";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: 'Thank You | Skool Video Downloader',
  description: 'Thank you for your purchase.',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  let body = `<div class="page-index site-layout"><header class=index-header><div class=header-container><a class=header-logo href=/><img src="assets/images/img_a38993e738.png" height=30 width=30 alt="Skool Video Downloader Logo"><span>Skool Video Downloader</span></a><nav class=header-nav><a href=/#features>Features</a><a href=/#reviews>Reviews</a><a href=/#pricing>Pricing</a></nav><div class=header-actions><a href=/#pricing><button class="button button--primary button--small">Get It Now</button></a></div></div></header><main class=site-main><div class=blog-layout style="text-align:center; padding: 100px 20px;"><article class=blog-article><div class=blog-article-content><div style="font-size: 64px; margin-bottom: 24px;">✉️</div><h1 class=blog-article-title style="margin-bottom: 16px;">Message Received!</h1><p class=blog-paragraph>Thank you for reaching out to Skool Video Downloader. We've received your message and our team will get back to you at the email provided within <strong>24 business hours</strong>.<div style="margin-top: 40px;"><a href=/ class="button button--primary">Back to Homepage</a></div></div></article></div></main><footer class=site-footer><div class=footer-container><div class=footer-features><h4 class=footer-section-title>Features</h4><div class=footer-features-grid><a class=footer-feature-link href=/#features>Skool Video Downloader</a><a class=footer-feature-link href=/#features>Loom Video Downloader</a><a class=footer-feature-link href=/#features>Vimeo Video Downloader</a><a class=footer-feature-link href=/#features>Wistia Support</a><a class=footer-feature-link href=/#features>Native Skool Player</a><a class=footer-feature-link href=/#features>HLS to MP4 Conversion</a><a class=footer-feature-link href=/#features>Batch Downloads</a><a class=footer-feature-link href=/#features>Local Processing, Zero Tracking</a><a class=footer-feature-link href=/#pricing>Lifetime License</a><a class=footer-feature-link href=/#pricing>Monthly Plan</a><a class=footer-feature-link href=/dashboard>Your Dashboard</a><a class=footer-feature-link href=/blog>Guides &amp; Tutorials</a></div></div><div class=footer-divider></div><div class=footer-bottom><div class=footer-brand><img src="assets/images/img_987e4189cb.png" alt="Skool Video Downloader logo" class=footer-logo><span>© 2026 Skool Video Downloader</span></div><div class=footer-links><a href=/#pricing>Pricing</a><a href=contact>Contact</a><a href=privacy>Privacy</a><a href=terms>Terms</a><a href=refund-policy>Refund</a><a href=dmca>DMCA</a><a href=https://x.com/skoolvideosaver target=_blank rel="noreferrer noopener" class=footer-social aria-label="Follow @skoolvideosaver on X"><svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24" aria-hidden=true class=social-icon><g><path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"></path></g></svg><span>@skoolvideodownloader</span></a></div><div class=footer-meta><span>Version 2.2.1</span><span class=footer-separator>•</span><span>Chrome Extension</span><span class=footer-separator>•</span><a href=mailto:hello@skoolvideosaver.com class=footer-email>hello@skoolvideosaver.com</a></div></div></div></footer></div>`;
  
  const loginButton = session 
    ? `<a href="/dashboard"><button class="button button--secondary button--small">Dashboard</button></a>`
    : `<a href="/login"><button class="button button--secondary button--small">Login</button></a>`;
    
  const getItNowButton = session
    ? `<a href="/dashboard" target="_blank"><button class="button button--primary button--small">Get It Now</button></a>`
    : `<a href="${CHROME_STORE_URL}" target="_blank"><button class="button button--primary button--small">Get It Now</button></a>`;

  // Replace header actions
  body = body.replace(/<div class=header-actions>.*?<\/div>/s, `<div class="header-actions">${loginButton}${getItNowButton}</div>`);

  return (
    <>
      <link rel="stylesheet" href="/assets/css/main.css" />
      <div dangerouslySetInnerHTML={ { __html: body } } />
    </>
  );
}
