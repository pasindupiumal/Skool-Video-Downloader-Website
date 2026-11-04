import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin, generateTemporaryPassword } from "@/lib/admin-auth";
import { usersCollection } from "@/lib/db";

// There's no self-serve "forgot password" flow (that needs a transactional
// email provider to prove the requester owns the account, which this project
// doesn't have set up). Instead this generates a temporary password, shown
// once here, that the admin relays to the user manually.
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json().catch(() => ({}));
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const users = await usersCollection();
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await users.findOne({ email: normalizedEmail });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  await users.updateOne(
    { _id: user._id },
    { $set: { passwordHash, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true, temporaryPassword });
}
