import React from 'react';
import { CHROME_STORE_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { jsonLd, webPageSchema } from "@/lib/seo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: 'Terms of Service | Video Saver for Skool',
  description: 'Terms of service for the Video Saver for Skool Chrome extension and website.',
  alternates: { canonical: '/terms' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: `${SITE_URL}/terms`,
    title: 'Terms of Service | Video Saver for Skool',
    description: 'Terms of service for the Video Saver for Skool Chrome extension and website.',
    images: [{ url: `${SITE_URL}/opengraph-image.jpg`, width: 1200, height: 630, alt: SITE_NAME }],
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  let body = `<div class="page-index site-layout"><header class=index-header><div class=header-container><a class=header-logo href=/><img src="/assets/images/img_a38993e738.webp" height=30 width=30 alt="Video Saver for Skool Logo"><span>Video Saver for Skool</span></a><nav class=header-nav><a href=/#features>Features</a><a href=/#pricing>Pricing</a></nav><div class=header-actions><a href=/#pricing><button class="button button--primary button--small">Get It Now</button></a></div></div></header><main class=site-main><div class=blog-layout><article class=blog-article><a class=blog-back-link href=/>← Back to Home</a><header class=blog-article-header><h1 class=blog-article-title>Terms of Service</h1><div class=blog-article-meta><time>Last updated: November 23, 2026</time></div></header><div class=blog-article-content>
    <p class=blog-paragraph>By installing or using Video Saver for Skool, you agree to these terms. Please read them carefully.<h2 class=blog-h2>Operator &amp; Governing Law</h2><p class=blog-paragraph>Video Saver for Skool is operated by [TODO: Legal entity or operator name]. These Terms are governed by the laws of [TODO: Country / jurisdiction]. For legal notices or questions, contact <a class=blog-link href=mailto:hello@skoolvideosaver.com>hello@skoolvideosaver.com</a>.<h2 class=blog-h2>Personal Archival Use</h2><p class=blog-paragraph>Video Saver for Skool is intended for personal archival use only. You are responsible for ensuring that you have the right to download the content you are saving. Do not use this tool to infringe on the copyrights of course creators or Skool communities.<h2 class=blog-h2>No Redistribution</h2><p class=blog-paragraph>You agree not to redistribute, sell, or publicly share content downloaded using Video Saver for Skool without the express permission of the original content owner.<h2 class=blog-h2>Lifetime Access</h2><p class=blog-paragraph>Our Lifetime Pro plan is a one-time payment that grants you access to all current Pro features for the duration of the product's existence. We aim to support Skool indefinitely, but cannot guarantee support if Skool makes fundamental technical changes that prevent video detection.<h2 class=blog-h2>14-Day Refund Policy</h2><p class=blog-paragraph>We offer a 14-day refund policy, no questions asked. If you are not happy with your purchase for any reason, email us at <a class=blog-link href=mailto:hello@skoolvideosaver.com>hello@skoolvideosaver.com</a> within 14 days of your purchase and we will refund you. Refunds are issued to your original payment method and may take 5-7 business days to appear. Your account returns to the free plan once the refund is processed.<h2 class=blog-h2>Disclaimer of Warranty</h2><p class=blog-paragraph>The software is provided "as is", without warranty of any kind. We are not liable for any damages resulting from the use of this tool.</p>
    </div></article></div></main></div>`;

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(webPageSchema({ path: '/terms', name: 'Terms of Service' })) }} />
      <div dangerouslySetInnerHTML={{ __html: body }} />
      <SiteFooter />
    </>
  );
}
