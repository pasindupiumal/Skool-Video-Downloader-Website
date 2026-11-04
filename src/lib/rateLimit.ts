import { getDbForRateLimit } from "./db";

// Fixed-window rate limiter backed by MongoDB, so the limit holds across
// serverless instances (an in-memory counter would reset per cold start).
// Expired windows are cleaned up by the TTL index on expiresAt — see
// scripts/ensure-indexes.js.
export async function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const windowMs = windowSeconds * 1000;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const id = `${bucket}:${identifier}:${windowStart}`;

  try {
    const db = await getDbForRateLimit();
    const doc = await db.collection<{ _id: string; count: number; expiresAt: Date }>("rateLimits").findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
      { upsert: true, returnDocument: "after" }
    );
    const count = doc?.count ?? 1;
    return {
      allowed: count <= limit,
      retryAfterSeconds: Math.ceil((windowStart + windowMs - Date.now()) / 1000),
    };
  } catch (err) {
    // Never lock everyone out because the limiter itself failed.
    console.error("Rate limiter error (allowing request):", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function clientIp(headers: Headers | Record<string, any> | undefined): string {
  if (!headers) return "unknown";
  const get = (name: string): string | undefined =>
    typeof (headers as Headers).get === "function"
      ? (headers as Headers).get(name) ?? undefined
      : (headers as Record<string, any>)[name];
  const forwarded = get("x-forwarded-for");
  return (forwarded ? String(forwarded).split(",")[0].trim() : get("x-real-ip")) || "unknown";
}
