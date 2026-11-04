import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { usersCollection } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const authOptions: NextAuthOptions = {
  // No fallback on purpose: a hardcoded secret would let anyone forge sessions
  // if the env var were ever missing. NextAuth refuses to run in production
  // without one.
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        // Slow down password guessing: per IP and per targeted account.
        const [byIp, byEmail] = await Promise.all([
          rateLimit("login-ip", clientIp(req?.headers), 20, 15 * 60),
          rateLimit("login-email", email, 10, 15 * 60),
        ]);
        if (!byIp.allowed || !byEmail.allowed) {
          throw new Error("Too many login attempts. Please wait 15 minutes and try again.");
        }

        let user;
        try {
          const users = await usersCollection();
          user = await users.findOne({ email });
        } catch (err) {
          console.error("Login failed: database unreachable", err);
          throw new Error("Login is temporarily unavailable. Please try again in a few minutes.");
        }

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user._id!.toString(),
          email: user.email,
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          image: user.image || null,
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user?.email) {
        // Always resolve the sub/id from our own users collection by email,
        // since the CredentialsProvider id and the Mongo _id must match.
        const users = await usersCollection();
        const dbUser = await users.findOne({ email: user.email.toLowerCase().trim() });
        if (dbUser?._id) {
          token.sub = dbUser._id.toString();
        }
        token.email = user.email;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};
