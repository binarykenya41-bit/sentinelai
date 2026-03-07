import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// ---------------------------------------------------------------------------
// Browser / client-side Supabase client
// Uses the anon key — safe to expose in the browser (RLS enforced)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// ---------------------------------------------------------------------------
// Server-side Supabase client (service role — bypasses RLS)
// ONLY use in server components, API routes, or server actions.
// NEVER import this in client components.
// ---------------------------------------------------------------------------
export function createServiceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. This client must only be used in server-side code."
    )
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
