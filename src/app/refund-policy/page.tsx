import React from 'react';
import { CHROME_STORE_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { jsonLd, webPageSchema } from "@/lib/seo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: 'Refund Policy - 14-Day Refunds | Video Saver for Skool',
  description: 'Video Saver for Skool offers a 14-day refund on purchases. Read the refund policy.',
  alternates: { canonical: '/refund-policy' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: `${SITE_URL}/refund-policy`,
    title: 'Refund Policy - 14-Day Refunds | Video Saver for Skool',
    description: 'Video Saver for Skool offers a 14-day refund on purchases. Read the refund policy.',
    images: [{ url: `${SITE_URL}/opengraph-image.jpg`, width: 1200, height: 630, alt: SITE_NAME }],
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  let body = `<div class="page-index site-layout"><header class=index-header><div class=header-container><a class=header-logo href=/><img src="/assets/images/img_a38993e738.webp" height=30 width=30 alt="Video Saver for Skool Logo"><span>Video Saver for Skool</span></a><nav class=header-nav><a href=/#features>Features</a><a href=/#pricing>Pricing</a></nav><div class=header-actions><a href=/login><button class="button button--secondary button--small">Login</button></a><a href=${CHROME_STORE_URL} target=_blank><button class="button button--primary button--small">Get It Now</button></a></div></div></header><main class=site-main><div class=blog-layout><article class=blog-article><a class=blog-back-link href=/>← Back to Home</a><header class=blog-article-header><h1 class=blog-article-title>Refund Policy</h1><div class=blog-article-meta><time>Last updated: November 7, 2026</time></div></header><div class=blog-article-content><p class=blog-paragraph>We want you to be happy with Video Saver for Skool. That's why we offer a 14-day refund policy, no questions asked.<p class=blog-paragraph><strong class=blog-strong>14-Day Refund Policy.</strong> If you are not happy with your purchase for any reason, you can request a refund within 14 days of your purchase.<p class=blog-paragraph><strong class=blog-strong>How to Request a Refund.</strong> Email us at <a href=mailto:hello@skoolvideosaver.com class=blog-link>hello@skoolvideosaver.com</a> with "Refund Request" in the subject line and include your account email address. You don't need to give a reason.<p class=blog-paragraph><strong class=blog-strong>After Your Refund.</strong> Refunds are issued to your original payment method and may take 5-7 business days to appear in your account. Your account access will be downgraded to the free plan once the refund is processed.<p class=blog-paragraph><strong class=blog-strong>Questions?</strong> If you have questions about our refund policy, please contact us at <a href=mailto:hello@skoolvideosaver.com class=blog-link>hello@skoolvideosaver.com</a>. We're here to help!</p></div></article></div></main></div>`;
  
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(webPageSchema({ path: '/refund-policy', name: 'Refund Policy' })) }} />
      <div dangerouslySetInnerHTML={ { __html: body } } />
      <SiteFooter />
    </>
  );
}
