import React from 'react';
import { CHROME_STORE_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { jsonLd, webPageSchema } from "@/lib/seo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: 'DMCA Policy | Video Saver for Skool',
  description: 'DMCA and copyright policy for Video Saver for Skool, including how to submit a takedown notice.',
  alternates: { canonical: '/dmca' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: `${SITE_URL}/dmca`,
    title: 'DMCA Policy | Video Saver for Skool',
    description: 'DMCA and copyright policy for Video Saver for Skool, including how to submit a takedown notice.',
    images: [{ url: `${SITE_URL}/opengraph-image.jpg`, width: 1200, height: 630, alt: SITE_NAME }],
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  let body = `<div class="page-index site-layout"><header class=index-header><div class=header-container><a class=header-logo href=/><img src="/assets/images/img_a38993e738.webp" height=30 width=30 alt="Video Saver for Skool Logo"><span>Video Saver for Skool</span></a><nav class=header-nav><a href=/#features>Features</a><a href=/#pricing>Pricing</a></nav><div class=header-actions><a href=/login><button class="button button--secondary button--small">Login</button></a><a href=${CHROME_STORE_URL} target=_blank><button class="button button--primary button--small">Get It Now</button></a></div></div></header><main class=site-main><div class=blog-layout><article class=blog-article><a class=blog-back-link href=/>← Back to Home</a><header class=blog-article-header><h1 class=blog-article-title>DMCA &amp; Removal Requests</h1><div class=blog-article-meta><time>Last updated: November 7, 2026</time></div></header><div class=blog-article-content><p class=blog-paragraph>Video Saver for Skool hosts brand logos sourced from open-source icon libraries to make it easier for learners, learners, and documentation writers to embed brand marks correctly. We respect copyright and trademark rights and act on valid removal requests promptly.<p class=blog-paragraph>If you are a brand owner or an authorized representative and want a logo removed, you don’t need to involve Google or file a DMCA notice with a third-party search engine — email us directly and we’ll process the request faster than the search engine route.<h2 class=blog-h2>Course creators and video owners</h2><p class=blog-paragraph>Video Saver for Skool is a browser extension. It does not host, store or republish Skool course videos: it saves videos that a user's own logged-in browser can already play, and the files stay on that user's device. Because we do not host that material, we cannot remove it from a user's computer. If you are a course creator or rights holder with a concern about how the extension is used with your content, email us at the address below with the subject line <strong class=blog-strong>Creator concern</strong>, the community or course involved, and what you would like us to look at. We read every message and will reply. Our <a class=blog-link href=/terms>Terms of Service</a> require users to download only content they have the right to save, for personal use, and prohibit redistributing or selling it.<h2 class=blog-h2>Where to send the request</h2><p class=blog-paragraph>Email <a class=blog-link href=mailto:hello@skoolvideosaver.com>hello@skoolvideosaver.com</a> with the details below. We monitor this address during business days and aim to respond within <strong class=blog-strong>3 business days</strong>.<h2 class=blog-h2>What to include in your request</h2><p class=blog-paragraph>To act on a request quickly, please include all of the following. This mirrors the requirements of <a class=blog-link href=https://www.copyright.gov/title17/92chap5#512 target=_blank rel="noreferrer noopener">17 U.S.C. § 512(c)(3)</a>:<ul class=blog-paragraph style=padding-left:20px><li><strong class=blog-strong>Identification of the work</strong> — the name of the brand, product, or asset whose copyright or trademark you are asserting (e.g. “AllTrails”, “Spotify”).<li><strong class=blog-strong>Affected URLs</strong> — every URL on skoolvideosaver.com you want removed (e.g. <code>/#brands/alltrails</code>). You can list more than one.<li><strong class=blog-strong>Authority statement</strong> — confirmation that you are the rights holder, an officer of the rights-holding company, or an authorized agent.<li><strong class=blog-strong>Contact info</strong> — your full legal name, organisation name, postal address, phone, and a reply-to email.<li><strong class=blog-strong>Good-faith statement</strong> — “I have a good-faith belief that the use of the material in the manner complained of is not authorised by the copyright owner, its agent, or the law.”<li><strong class=blog-strong>Accuracy statement</strong> — “The information in this notification is accurate, and under penalty of perjury, I am authorised to act on behalf of the rights holder.”<li><strong class=blog-strong>Signature</strong> — a physical or electronic signature.</ul><h2 class=blog-h2>What happens next</h2><p class=blog-paragraph>Once we receive a complete request, we:<ul class=blog-paragraph style=padding-left:20px><li>Remove the affected page(s) and the associated logo files from our CDN within <strong class=blog-strong>3 business days</strong>. The URL will return a 404 immediately after the next deploy.<li>Add the brand to an internal block list so the page won’t reappear if our underlying icon source updates.<li>Reply to confirm the action and reference your request.<li>Where applicable, log the takedown publicly on <a class=blog-link href=https://lumendatabase.org/ target=_blank rel="noreferrer noopener">Lumen</a> for transparency.</ul><h2 class=blog-h2>Counter-notices</h2><p class=blog-paragraph>If you believe content was removed in error and you have a good-faith basis to contest the takedown, you can email <a class=blog-link href=mailto:hello@skoolvideosaver.com>hello@skoolvideosaver.com</a> with a counter-notice that includes your contact information, identification of the removed content, a statement made under penalty of perjury that you have a good-faith belief the content was removed by mistake or misidentification, and consent to jurisdiction of the US federal district court covering your address (or the Northern District of California if outside the US).<h2 class=blog-h2>Repeat infringers</h2><p class=blog-paragraph>We retain a record of takedown notices and may permanently block content sources that result in repeated infringement claims.<h2 class=blog-h2>Other contact</h2><p class=blog-paragraph>For general support, partnerships, or press enquiries you can also use the form at <a class=blog-link href=/contact>/contact</a>. When emailing about a takedown, please put <strong class=blog-strong>DMCA</strong> in the subject line so we can route it correctly.</p></div></article></div></main></div>`;
  
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(webPageSchema({ path: '/dmca', name: 'DMCA Policy' })) }} />
      <div dangerouslySetInnerHTML={ { __html: body } } />
      <SiteFooter />
    </>
  );
}
