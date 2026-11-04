import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/admin-auth";
import { contactMessagesCollection } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, read } = await request.json().catch(() => ({}));
  if (!id || typeof read !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }

  const messages = await contactMessagesCollection();
  await messages.updateOne({ _id: new ObjectId(id) }, { $set: { read } });

  return NextResponse.json({ success: true });
}
