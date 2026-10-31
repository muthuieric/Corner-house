import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The Karibu VMS dashboard is an in-progress scaffold that needs a real Supabase
// project to be useful. Locally/dev builds leave these blank, but `createClient`
// throws "supabaseUrl is required" when given empty strings — which crashed the
// static prerender of the dashboard routes at build time.

// Fix: fall back to placeholder credentials (non-empty so the client constructs
// without throwing) and construct the client lazily through a Proxy so merely
// importing this module never triggers a network request or a throw. Once
// NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are populated, real credentials are used.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

/**
 * Lazily-backed Supabase client. Importing this module (e.g. during SSG
 * prerendering of the dashboard scaffold) is side-effect free; the real client
 * is only constructed on first property access.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    const value = (c as Record<string, unknown>)[prop as string];
    return typeof value === "function" ? value.bind(c) : value;
  },
});

export function getSupabaseBrowser(): SupabaseClient {
  return getClient();
}