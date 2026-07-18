import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn("Supabase env vars missing. Persistence features will be disabled.");
}

export const supabase = createClient(url ?? "", anonKey ?? "");

export const supabaseConfigured = Boolean(url && anonKey);
