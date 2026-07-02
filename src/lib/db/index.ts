import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import * as schema from "./schema"

type Db = NeonHttpDatabase<typeof schema>

let cached: Db | null = null

function getDb(): Db {
  if (cached) return cached
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  const sql = neon(process.env.DATABASE_URL)
  cached = drizzle(sql, { schema })
  return cached
}

// Lazy proxy: importing this module (which happens at Next.js build time while
// collecting page data) must never require DATABASE_URL to be set. Only the
// first actual query, at request time, needs it.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
