import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { jsonLd, organizationSchema, websiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Skool Video Downloader & Saver - 5 Free Downloads",
  description: "Skool video downloader Chrome extension. Download Skool videos (native Skool, YouTube, Loom, Vimeo, Wistia) as MP4 files, processed locally. 5 free downloads to try.",
  keywords: ["skool video downloader", "skool video saver", "download skool videos", "save skool videos", "download skool lessons", "skool downloader"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Skool Video Downloader & Saver | Video Saver for Skool",
    description: "Download Skool videos as private MP4 files. Works with native Skool, YouTube, Loom, Vimeo and Wistia. 5 free downloads.",
    url: SITE_URL,
    siteName: "Video Saver for Skool",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@skoolvideosaver",
    title: "Skool Video Downloader & Saver",
    description: "Download Skool videos as MP4. Native Skool, YouTube, Loom, Vimeo, Wistia. 5 free downloads.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
                <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  // Load Tag Manager after the page has finished loading (or on first interaction)
  // so its ~180 KB doesn't compete with the content for bandwidth.
  (function(){
    var loaded=false;
    function load(){
      if(loaded) return; loaded=true;
      var s=document.createElement('script'); s.async=true;
      s.src='https://www.googletagmanager.com/gtm.js?id=GTM-NV2J2FCZ';
      document.head.appendChild(s);
    }
    ['pointerdown','keydown','scroll','touchstart'].forEach(function(e){window.addEventListener(e,load,{once:true,passive:true});});
    window.addEventListener('load',function(){setTimeout(load,2500);});
  })();
`,
          }}
        />
        <meta name="yandex-verification" content="f72b55d01d55baa0" />
        <link rel="stylesheet" href="/assets/css/index.css" />
        <link rel="preload" href="/assets/fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <style
          dangerouslySetInnerHTML={{
            __html:
              '@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:200 800;font-display:swap;src:url(/assets/fonts/plus-jakarta-sans-latin-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}' +
              '@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:200 800;font-display:swap;src:url(/assets/fonts/plus-jakarta-sans-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}' +
              ":root{--font-main:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}body,button,input,textarea,select{font-family:var(--font-main)!important}h1,h2,h3,h4,h5,h6{font-family:var(--font-main)!important;font-weight:700}.highlight{font-weight:800!important;position:relative;z-index:1}.highlight:before{content:\"\";z-index:-1;opacity:.8;border-radius:4px;height:12%!important;position:absolute;bottom:4px!important;left:-4px;right:-4px;animation:.6s ease-out forwards highlightFadeIn}.highlight-purple:before{background:linear-gradient(135deg,#c084fc 0%,#a855f7 100%)!important}.highlight-blue:before{background:linear-gradient(135deg,#60a5fa 0%,#3b82f6 100%)!important}@keyframes highlightFadeIn{0%{opacity:0;transform:scaleX(0)}100%{opacity:.8;transform:scaleX(1)}}",
          }}
        />
      </head>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([organizationSchema, websiteSchema]) }} />
      </body>
    </html>
  );
}
