import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const rawUrl = process.env.DATABASE_URL || "file:data/portfolio.db";
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

let dbUrl = rawUrl;
if (rawUrl.startsWith("file:")) {
  const filePath = rawUrl.replace(/^file:/, "");
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), filePath);
  const parentDir = path.dirname(absolutePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  dbUrl = `file:${absolutePath}`;
}

export const client = createClient({
  url: dbUrl,
  authToken,
});

export const db = drizzle(client, { schema });

