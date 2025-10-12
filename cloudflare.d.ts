/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    moderateur_bedones_db: D1Database;
  }
}

export {};
