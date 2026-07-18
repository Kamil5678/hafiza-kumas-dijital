import { supabase } from "./supabase";

export type ContentType = "lesson" | "quiz" | "flashcards" | "summary" | "glossary";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface EngineResult {
  cached: boolean;
  generated_at: string;
  content: Record<string, unknown>;
}

export interface EngineError {
  error: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-engine`;

export async function generateContent(params: {
  slug: string;
  content_type: ContentType;
  difficulty?: Difficulty;
  force?: boolean;
}): Promise<EngineResult> {
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
      content_type: params.content_type,
      difficulty: params.difficulty ?? "intermediate",
      force: params.force ?? false,
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
    const e = json as EngineError;
    throw new Error(e?.error ?? `İstek başarısız (HTTP ${res.status})`);
  }

  return json as EngineResult;
}

export async function fetchCachedContent(
  slug: string,
  content_type: ContentType,
  difficulty: Difficulty,
): Promise<EngineResult | null> {
  const { data, error } = await supabase
    .from("generated_content")
    .select("payload, updated_at")
    .eq("node_slug", slug)
    .eq("content_type", content_type)
    .eq("difficulty", difficulty)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { cached: true, generated_at: data.updated_at, content: data.payload as Record<string, unknown> };
}
