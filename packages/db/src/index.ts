import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";

/** Typed schema helper; runtime client is loosely typed for insert/update DX. */
export type FinoraSupabase = SupabaseClient<Database>;

export function createServiceClient(
  url: string,
  serviceRoleKey: string,
): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAnonClient(
  url: string,
  anonKey: string,
  accessToken?: string,
): SupabaseClient {
  return createClient(url, anonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type { Database } from "./types.js";
