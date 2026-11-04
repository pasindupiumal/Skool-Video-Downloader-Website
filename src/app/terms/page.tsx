import React from 'react';
import { CHROME_STORE_URL } from "@/lib/site";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: 'Terms of Service | Skool Video Downloader',
  description: 'Our terms of service.',
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  let body = `<div class="page-index site-layout"><header class=index-header><div class=header-container><a class=header-logo href=/><img src="assets/images/img_a38993e738.png" height=30 width=30 alt="Skool Video Downloader Logo"><span>Skool Video Downloader</span></a><nav class=header-nav><a href=/#features>Features</a><a href=/#reviews>Reviews</a><a href=/#pricing>Pricing</a></nav><div class=header-actions><a href=/#pricing><button class="button button--primary button--small">Get It Now</button></a></div></div></header><main class=site-main><div class=blog-layout><article class=blog-article><a class=blog-back-link href=/>← Back to Home</a><header class=blog-article-header><h1 class=blog-article-title>Terms of Service</h1><div class=blog-article-meta><time>Last updated: May 05, 2026</time></div></header><div class=blog-article-content>
    <p class=blog-paragraph>By installing or using Skool Video Downloader, you agree to these terms. Please read them carefully.<h2 class=blog-h2>Personal Archival Use</h2><p class=blog-paragraph>Skool Video Downloader is intended for personal archival use only. You are responsible for ensuring that you have the right to download the content you are saving. Do not use this tool to infringe on the copyrights of course creators or Skool communities.<h2 class=blog-h2>No Redistribution</h2><p class=blog-paragraph>You agree not to redistribute, sell, or publicly share content downloaded using Skool Video Downloader without the express permission of the original content owner.<h2 class=blog-h2>Lifetime Access</h2><p class=blog-paragraph>Our Lifetime Pro plan is a one-time payment that grants you access to all current Pro features for the duration of the product's existence. We aim to support Skool indefinitely, but cannot guarantee support if Skool makes fundamental technical changes that prevent video detection.<h2 class=blog-h2>Disclaimer of Warranty</h2><p class=blog-paragraph>The software is provided "as is", without warranty of any kind. We are not liable for any damages resulting from the use of this tool.</p>
    </div></article></div></main><footer class=site-footer><div class=footer-container><div class=footer-features><h4 class=footer-section-title>Features</h4><div class=footer-features-grid><a class=footer-feature-link href=/#features>Skool Video Downloader</a><a class=footer-feature-link href=/#features>Loom Video Downloader</a><a class=footer-feature-link href=/#features>Vimeo Video Downloader</a><a class=footer-feature-link href=/#features>Wistia Support</a><a class=footer-feature-link href=/#features>Native Skool Player</a><a class=footer-feature-link href=/#features>HLS to MP4 Conversion</a><a class=footer-feature-link href=/#features>Batch Downloads</a><a class=footer-feature-link href=/#features>Local Processing, Zero Tracking</a><a class=footer-feature-link href=/#pricing>Lifetime License</a><a class=footer-feature-link href=/#pricing>Monthly Plan</a><a class=footer-feature-link href=/dashboard>Your Dashboard</a><a class=footer-feature-link href=/blog>Guides &amp; Tutorials</a></div></div><div class=footer-divider></div><div class=footer-bottom><div class=footer-brand><img src="assets/images/img_987e4189cb.png" alt="Skool Video Downloader logo" class=footer-logo><span>© 2026 Skool Video Downloader</span></div><div class=footer-links><a href=/#pricing>Pricing</a><a href=contact>Contact</a><a href=privacy>Privacy</a><a href=terms>Terms</a><a href=refund-policy>Refund</a><a href=dmca>DMCA</a><a href=https://x.com/skoolvideodownloader target=_blank rel="noreferrer noopener" class=footer-social aria-label="Follow @skoolvideodownloader on X"><svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24" aria-hidden=true class=social-icon><g><path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"></path></g></svg><span>@skoolvideodownloader</span></a></div><div class=footer-meta><span>Version 2.2.1</span><span class=footer-separator>•</span><span>Chrome Extension</span><span class=footer-separator>•</span><a href=mailto:hello@skoolvideosaver.com class=footer-email>hello@skoolvideosaver.com</a></div></div></div></footer></div>`;
  
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
      <link rel="stylesheet" href="/assets/css/dmca.css" />
      <div dangerouslySetInnerHTML={ { __html: body } } />
    </>
  );
}
