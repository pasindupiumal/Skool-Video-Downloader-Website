import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skool Video Downloader | Professional Video Archival Tool",
  description: "The #1 Chrome extension for saving videos from Skool classroom lessons, community posts, and course replays as local MP4 files. Fast, private, and 100% secure.",
  keywords: ["skool video downloader", "skool video saver", "download skool lessons", "save skool videos"],
  openGraph: {
    title: "Skool Video Downloader",
    description: "Archive your favorite Skool lessons locally for offline learning.",
    url: "https://skoolvideosaver.com",
    siteName: "Skool Video Downloader",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@skoolvideodownloader",
    title: "Skool Video Downloader",
    description: "The ultimate companion for Skool learners.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/index.css" />
        <link rel="stylesheet" href="/assets/css/shared-typography.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
