import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { usersCollection } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const limit = await rateLimit("signup", clientIp(request.headers), 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many sign-up attempts. Please try again later." }, { status: 429 });
  }

  try {
    const { firstName, lastName, email, mobile, country, password, confirmPassword } =
      await request.json();

    if (!firstName || !lastName || !email || !country || !password || !confirmPassword) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const users = await usersCollection();
    const existing = await users.findOne({ email: normalizedEmail });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    try {
      await users.insertOne({
        email: normalizedEmail,
        passwordHash,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        name: `${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
        mobile: mobile ? String(mobile).trim() : null,
        country: String(country).trim(),
        downloadsUsed: 0,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err: any) {
      // Unique index on email — catches the race where two signups for the
      // same address land between the findOne check above and this insert.
      if (err?.code === 11000) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
