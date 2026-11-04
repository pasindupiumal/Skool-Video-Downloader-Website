import { withAuth } from "next-auth/middleware";

// /admin is intentionally excluded here — it has its own standalone
// username/password session (see src/lib/admin-auth.ts), checked directly
// in each admin page/route, not the site's NextAuth session.
export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
