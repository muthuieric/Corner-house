import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : null;
  return ip || request.headers.get("x-forwarded-for") || "unknown";
}

export function checkRateLimit(
  request: NextRequest,
  { keyPrefix, limit, windowMs }: RateLimitOptions
): NextResponse | null {
  try {
    const key = `${keyPrefix}:${clientKey(request)}`;
    const now = Date.now();
    const existing = store.get(key);

    if (!existing || now > existing.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return null;
    }

    if (existing.count >= limit) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    existing.count += 1;
    return null;
  } catch {
    return null;
  }
}
