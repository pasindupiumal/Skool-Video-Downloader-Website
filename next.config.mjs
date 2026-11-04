/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a production build run while `next dev` holds .next (Windows file lock).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Type errors fail the build (they catch real bugs). ESLint's style rules
  // (mostly no-explicit-any, used throughout the codebase) don't block a deploy.
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Pricing lives on the homepage; people still type /pricing directly.
      { source: "/pricing", destination: "/#pricing", permanent: true },
    ];
  },
};

export default nextConfig;
