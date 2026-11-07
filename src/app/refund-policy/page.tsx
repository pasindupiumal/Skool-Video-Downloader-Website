import React from 'react';
import { CHROME_STORE_URL } from "@/lib/site";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: 'Refund Policy - 14-Day Refunds | Video Saver for Skool',
  description: 'Video Saver for Skool offers a 14-day refund on purchases. Read the refund policy.',
  alternates: { canonical: '/refund-policy' },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  let body = `<div class="page-index site-layout"><header class=index-header><div class=header-container><a class=header-logo href=/><img src="assets/images/img_a38993e738.png" height=30 width=30 alt="Video Saver for Skool Logo"><span>Video Saver for Skool</span></a><nav class=header-nav><a href=#features>Features</a><a href=#pricing>Pricing</a></nav><div class=header-actions><a href=login><button class="button button--secondary button--small">Login</button></a><a href=${CHROME_STORE_URL} target=_blank><button class="button button--primary button--small">Get It Now</button></a></div></div></header><main class=site-main><div class=blog-layout><article class=blog-article><a class=blog-back-link href=/>← Back to Home</a><header class=blog-article-header><h1 class=blog-article-title>Refund Policy</h1><div class=blog-article-meta><time>Last updated: November 7, 2026</time></div></header><div class=blog-article-content><p class=blog-paragraph>We want you to be happy with Video Saver for Skool. That's why we offer a 14-day refund policy, no questions asked.<p class=blog-paragraph><strong class=blog-strong>14-Day Refund Policy.</strong> If you are not happy with your purchase for any reason, you can request a refund within 14 days of your purchase.<p class=blog-paragraph><strong class=blog-strong>How to Request a Refund.</strong> Email us at <a href=mailto:hello@skoolvideosaver.com class=blog-link>hello@skoolvideosaver.com</a> with "Refund Request" in the subject line and include your account email address. You don't need to give a reason.<p class=blog-paragraph><strong class=blog-strong>After Your Refund.</strong> Refunds are issued to your original payment method and may take 5-7 business days to appear in your account. Your account access will be downgraded to the free plan once the refund is processed.<p class=blog-paragraph><strong class=blog-strong>Questions?</strong> If you have questions about our refund policy, please contact us at <a href=mailto:hello@skoolvideosaver.com class=blog-link>hello@skoolvideosaver.com</a>. We're here to help!</p></div></article></div></main><footer class=site-footer><div class=footer-container><div class=footer-features><h4 class=footer-section-title aria-level=3>Features</h4><div class=footer-features-grid><a class=footer-feature-link href=/#features>Video Saver for Skool</a><a class=footer-feature-link href=/#features>YouTube Video Downloader</a><a class=footer-feature-link href=/#features>Loom Video Downloader</a><a class=footer-feature-link href=/#features>Vimeo Video Downloader</a><a class=footer-feature-link href=/#features>Wistia Video Downloader</a><a class=footer-feature-link href=/#features>Native Skool Player</a><a class=footer-feature-link href=/#features>HLS to MP4 Conversion</a><a class=footer-feature-link href=/#features>Live Download Progress</a><a class=footer-feature-link href=/#features>Local, Private Processing</a><a class=footer-feature-link href=/#pricing>Lifetime License</a><a class=footer-feature-link href=/#pricing>Monthly Plan</a><a class=footer-feature-link href=/dashboard>Your Dashboard</a><a class=footer-feature-link href=/blog>Guides &amp; Tutorials</a></div></div><div class=footer-divider></div><div class=footer-bottom><div class=footer-brand><img src="assets/images/img_987e4189cb.png" alt="Video Saver for Skool logo" class=footer-logo><span>© 2026 Video Saver for Skool</span></div><div class=footer-links><a href=/#pricing>Pricing</a><a href=contact>Contact</a><a href=privacy>Privacy</a><a href=terms>Terms</a><a href=refund-policy>Refund</a><a href=dmca>DMCA</a><a href=https://x.com/skoolvideodownloader target=_blank rel="noreferrer noopener" class=footer-social aria-label="Follow @skoolvideodownloader on X"><svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24" aria-hidden=true class=social-icon><g><path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"></path></g></svg><span>@skoolvideodownloader</span></a></div><div class=footer-meta><span>Version 2.3.0</span><span class=footer-separator>•</span><span>Chrome Extension</span><span class=footer-separator>•</span><a href=mailto:hello@skoolvideosaver.com class=footer-email>hello@skoolvideosaver.com</a></div></div></div></footer></div>`;
  
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
      <link rel="stylesheet" href="/assets/css/refund-policy.css" />
      <div dangerouslySetInnerHTML={ { __html: body } } />
    </>
  );
}
