/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a production build run while `next dev` holds .next (Windows file lock).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Type errors fail the build (they catch real bugs). ESLint's style rules
  // (mostly no-explicit-any, used throughout the codebase) don't block a deploy.
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/assets/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/assets/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/assets/css/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/assets/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/admin",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/dashboard",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Canonical host is www; send the bare domain there (301).
      {
        source: "/:path*",
        has: [{ type: "host", value: "skoolvideosaver.com" }],
        destination: "https://www.skoolvideosaver.com/:path*",
        permanent: true,
      },
      // Pricing lives on the homepage; people still type /pricing directly.
      { source: "/pricing", destination: "/#pricing", permanent: true },
    ];
  },
};

export default nextConfig;
