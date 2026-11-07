import { AUTHOR } from "@/lib/author";
import { SITE_URL, SITE_NAME, CHROME_STORE_URL, FREE_DOWNLOADS } from "@/lib/site";

export type FaqItem = { q: string; a: string };

/** Serialise JSON-LD safely for inlining in a <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  email: "hello@skoolvideosaver.com",
  sameAs: ["https://x.com/skoolvideosaver", CHROME_STORE_URL],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: ["Skool Video Downloader", "Skool Video Saver"],
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
};

export function softwareSchema(lifetimePrice: number | string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: SITE_NAME,
    alternateName: "Skool Video Downloader",
    description: `Chrome extension that downloads Skool videos (native Skool player, YouTube, Loom, Vimeo and Wistia) as MP4 files. Processing is local. ${FREE_DOWNLOADS} free downloads included.`,
    url: SITE_URL,
    dateModified: "2026-11-07",
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome, Edge, Brave, Opera (Windows, macOS, Linux)",
    downloadUrl: CHROME_STORE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: [
      { "@type": "Offer", name: `Free (${FREE_DOWNLOADS} downloads)`, price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Standard Monthly", price: "20", priceCurrency: "USD" },
      { "@type": "Offer", name: "Lifetime Pro", price: String(lifetimePrice), priceCurrency: "USD" },
    ],
  };
}

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

export function articleSchema(p: {
  title: string;
  description: string;
  slug: string;
  date?: string;
  modified?: string;
  keywords?: string[];
  wordCount?: number;
  category?: string;
}) {
  const url = `${SITE_URL}/blog/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: p.title,
    description: p.description,
    image: `${SITE_URL}/opengraph-image.jpg`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: p.date,
    dateModified: p.modified || p.date,
    inLanguage: "en-US",
    articleSection: p.category || "Guides",
    ...(p.keywords && p.keywords.length ? { keywords: p.keywords.join(", ") } : {}),
    ...(p.wordCount ? { wordCount: p.wordCount } : {}),
    author: {
      "@type": "Person",
      "@id": `${AUTHOR.url}#person`,
      name: AUTHOR.name,
      url: AUTHOR.url,
      jobTitle: AUTHOR.jobTitle,
      sameAs: [AUTHOR.url, AUTHOR.linkedin, AUTHOR.github],
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
      },
    },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

export function howToSchema(p: {
  name: string;
  description: string;
  totalTime?: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: p.name,
    description: p.description,
    totalTime: p.totalTime || "PT2M",
    tool: [
      { "@type": "HowToTool", name: "Video Saver for Skool Chrome Extension" },
      { "@type": "HowToTool", name: "Google Chrome, Brave, Edge, or Opera Browser" },
    ],
    step: p.steps.map((s, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function blogCollectionSchema(posts: { title: string; description: string; slug: string; date?: string }[], modified?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/blog#collection`,
    name: "Skool Video Downloader Guides, Tutorials & Comparisons",
    description:
      "Step-by-step guides and comparisons for downloading Skool classroom lessons and community post videos (Skool native Mux, YouTube, Loom, Vimeo, and Wistia) as MP4 files.",
    url: `${SITE_URL}/blog`,
    ...(modified ? { dateModified: modified } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: post.title,
        description: post.description,
      })),
    },
  };
}

/** Strip inline markdown formatting for plain-text JSON-LD fields. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*|\*|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pull "### Question" + answer paragraphs out of a "## Frequently Asked Questions" section. */
export function extractFaq(markdown: string): FaqItem[] {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const m = normalized.match(
    /##\s+Frequently Asked Questions[ \t]*\n+([\s\S]*?)(?=\n##\s[^#]|\n\*Primary Source|$)/i
  );
  if (!m) return [];
  return m[1]
    .trim()
    .split(/(?:^|\n)###\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((block) => {
      const [rawQ, ...rest] = block.split("\n");
      const q = stripInlineMarkdown(rawQ.replace(/^#+\s*/, ""));
      const a = stripInlineMarkdown(rest.join(" "));
      return { q, a };
    })
    .filter((i) => i.q && i.a);
}

export function videoSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Video Saver for Skool demo: save Skool lessons as MP4",
    description: "Short demo of the Video Saver for Skool Chrome extension downloading a Skool lesson video as an MP4 file.",
    thumbnailUrl: `${SITE_URL}/opengraph-image.jpg`,
    uploadDate: "2026-11-07",
    contentUrl: `${SITE_URL}/assets/videos/demo.mp4`,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}
