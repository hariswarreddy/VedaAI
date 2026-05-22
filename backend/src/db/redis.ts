import IORedis from "ioredis";
import { env } from "../config/env";

const url = (env.REDIS_URL || "").trim();

if (!url) {
  console.error("\n[redis] REDIS_URL is empty. Set it in backend/.env, e.g.:");
  console.error("  REDIS_URL=redis://localhost:6379");
  console.error(
    "  REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379\n",
  );
  process.exit(1);
}
if (!/^rediss?:\/\//.test(url)) {
  console.error(
    `\n[redis] REDIS_URL "${url}" is malformed. It must start with redis:// or rediss://.`,
  );
  console.error(
    "Make sure you copied the full ioredis URL (no quotes, no spaces).\n",
  );
  process.exit(1);
}

// BullMQ requires maxRetriesPerRequest: null
export const redisConnection = new IORedis(url, {
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => console.log("[redis] connected"));
redisConnection.on("error", (e) => console.error("[redis] error", e.message));

// A separate client for general caching (with default retries) — uses same URL
export const cache = new IORedis(url);
