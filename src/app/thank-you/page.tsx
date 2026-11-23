import React from 'react';
import { CHROME_STORE_URL } from "@/lib/site";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: 'Thank You | Video Saver for Skool',
  description: 'Thank you for your purchase.',
  alternates: { canonical: '/thank-you' },
  robots: { index: false, follow: false },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  let body = `<div class="page-index site-layout"><header class=index-header><div class=header-container><a class=header-logo href=/><img src="/assets/images/img_a38993e738.webp" height=30 width=30 alt="Video Saver for Skool Logo"><span>Video Saver for Skool</span></a><nav class=header-nav><a href=/#features>Features</a><a href=/#pricing>Pricing</a></nav><div class=header-actions><a href=/#pricing><button class="button button--primary button--small">Get It Now</button></a></div></div></header><main class=site-main><div class=blog-layout style="text-align:center; padding: 100px 20px;"><article class=blog-article><div class=blog-article-content><div style="font-size: 64px; margin-bottom: 24px;">✉️</div><h1 class=blog-article-title style="margin-bottom: 16px;">Message Received!</h1><p class=blog-paragraph>Thank you for reaching out to Video Saver for Skool. We've received your message and our team will get back to you at the email provided within <strong>24 business hours</strong>.<div style="margin-top: 40px;"><a href=/ class="button button--primary">Back to Homepage</a></div></div></article></div></main></div>`;
  
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
      <SiteFooter />
    </>
  );
}
