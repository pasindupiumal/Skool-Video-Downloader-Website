import type { FaqItem } from "@/lib/seo";

// Must mirror the visible FAQ on the homepage (src/app/page.tsx) so the
// FAQPage JSON-LD matches on-page content.
export const HOME_FAQ: FaqItem[] = [
  { q: "Can I use Skool Video Saver for free?", a: "Yes! The free plan includes 5 free downloads. Upgrade to the Monthly or Lifetime plan to unlock unlimited downloads." },
  { q: "Which video players does it support?", a: "This Skool video downloader saves videos from Skool's native player, plus YouTube, Loom, Vimeo, and Wistia videos embedded in your lessons." },
  { q: "What do I get with the Lifetime Pro plan?", a: "You get unlimited downloads, all supported players, email support, all future feature updates, and priority feature requests, with a one-time payment." },
  { q: "Is it really a one-time payment?", a: "Yes, the Lifetime plan is a one-time payment. Pay once, with no monthly fees or yearly renewals. If you prefer flexible billing, the Monthly plan is $20/mo with no contract." },
  { q: "How is the payment being processed?", a: "We use Dodo Payments and Stripe for secure checkout. We don't store your payment info directly." },
  { q: "Do you offer refunds?", a: "Yes! We offer a 14-day refund policy, no questions asked. If you are not happy with your purchase for any reason, email us at hello@skoolvideosaver.com within 14 days of your purchase and we will refund you." },
  { q: "Do I need Skool Video Saver?", a: "It's a good fit if you want to keep a private copy of your Skool lessons, watch them offline, and not lose them when a cohort closes or a membership ends." },
  { q: "I already use free extensions?", a: "Skool cohorts close and memberships expire. We help you keep a private copy for offline learning. Skool Video Saver handles Skool, YouTube, Loom, Vimeo, and Wistia videos in one tool, and processes them locally in your browser." },
  { q: "Does it work with private communities?", a: "Yes! It respects your Skool login and downloads from private cohorts you have access to." },
  { q: "How many free downloads do I get?", a: "You get 5 free trial downloads to test the quality before you buy." },
  { q: "How do I download Skool videos?", a: "Install the Video Saver for Skool Chrome extension, open a Skool classroom lesson or community post, and click the Download button the extension adds next to the video. Choose a quality and the video is saved as an MP4 file." },
  { q: "Is there a free Skool video downloader?", a: "Yes. You get 5 free downloads to test the extension before you buy. After that, upgrade to the Monthly or Lifetime plan for unlimited downloads." },
  { q: "Does my video data leave my computer?", a: "No. Videos are downloaded and converted locally in your browser. They are not uploaded to or processed on our servers." },
];
