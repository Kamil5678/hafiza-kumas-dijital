import { supabase } from "./supabase";

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/full-lesson`;

export async function generateLesson(
  slug: string,
  difficulty = "intermediate",
  force = false
): Promise<any> {
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ slug, difficulty, force }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "İçerik üretilemedi");
  }
  const data = await res.json();
  return data.content;
}

export async function fetchNotes(slug: string): Promise<string> {
  const { data } = await supabase
    .from("lesson_notes")
    .select("note")
    .eq("node_slug", slug)
    .order("updated_at", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0].note : "";
}

export async function saveNote(slug: string, note: string): Promise<void> {
  const { data: existing } = await supabase
    .from("lesson_notes")
    .select("id")
    .eq("node_slug", slug)
    .limit(1);

  if (existing && existing.length > 0) {
    await supabase
      .from("lesson_notes")
      .update({ note, updated_at: new Date().toISOString() })
      .eq("id", existing[0].id);
  } else {
    await supabase.from("lesson_notes").insert({ node_slug: slug, note });
  }
}
