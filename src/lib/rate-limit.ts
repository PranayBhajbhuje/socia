import { createHash } from "node:crypto";
import { db } from "@/prisma/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
}

export async function checkAuthRateLimit(request: Request, action: string, identity?: string): Promise<boolean> {
  const address = clientAddress(request);
  const keys = [digest(`${action}:ip:${address}`)];
  if (identity) keys.push(digest(`${action}:identity:${identity.trim().toLowerCase()}`));
  const now = new Date();

  return db.transaction(async (tx) => {
    for (const keyHash of keys) {
      const bucket = await tx.orm.AuthRateLimitBucket.where({ keyHash }).first();
      if (!bucket || now.getTime() - bucket.windowStartedAt.getTime() >= WINDOW_MS) {
        if (bucket) await tx.orm.AuthRateLimitBucket.where({ keyHash }).update({ windowStartedAt: now, requestCount: 1 });
        else await tx.orm.AuthRateLimitBucket.create({ keyHash, windowStartedAt: now, requestCount: 1 });
        continue;
      }
      if (bucket.requestCount >= MAX_REQUESTS) return false;
      await tx.orm.AuthRateLimitBucket.where({ keyHash }).update({ requestCount: bucket.requestCount + 1 });
    }
    return true;
  });
}
