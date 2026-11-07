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
