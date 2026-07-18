import { supabase } from "./supabase";
import type { Difficulty } from "./engine";

export interface FullLessonResult {
  cached: boolean;
  generated_at: string;
  generated_by?: string;
  content: Record<string, unknown>;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/full-lesson`;

export async function generateFullLesson(params: {
  slug: string;
  difficulty?: Difficulty;
  force?: boolean;
  use_ai?: boolean;
}): Promise<FullLessonResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    "X-Client-Info": "tekstil-hafizam",
  };

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      slug: params.slug,
      difficulty: params.difficulty ?? "intermediate",
      force: params.force ?? false,
      use_ai: params.use_ai ?? true,
    }),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Geçersiz yanıt (HTTP ${res.status})`);
  }

  if (!res.ok) {
    const e = json as { error?: string };
    throw new Error(e?.error ?? `İstek başarısız (HTTP ${res.status})`);
  }

  return json as FullLessonResult;
}

export async function fetchCachedFullLesson(
  slug: string,
  difficulty: Difficulty,
): Promise<FullLessonResult | null> {
  const { data, error } = await supabase
    .from("generated_content")
    .select("payload, updated_at")
    .eq("node_slug", slug)
    .eq("content_type", "full_lesson")
    .eq("difficulty", difficulty)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    cached: true,
    generated_at: data.updated_at,
    content: data.payload as Record<string, unknown>,
  };
}
