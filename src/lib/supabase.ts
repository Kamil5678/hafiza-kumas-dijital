import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon);

export interface ContentNode {
  id: string;
  parent_id: string | null;
  type: "module" | "submodule" | "topic" | "lesson";
  title: string;
  slug: string;
  description: string | null;
  position: number;
  created_at: string;
}

export async function fetchRoots(): Promise<ContentNode[]> {
  const { data, error } = await supabase
    .from("content_nodes")
    .select("*")
    .is("parent_id", null)
    .order("position");
  if (error) throw error;
  return data as ContentNode[];
}

export async function fetchChildren(parentId: string): Promise<ContentNode[]> {
  const { data, error } = await supabase
    .from("content_nodes")
    .select("*")
    .eq("parent_id", parentId)
    .order("position");
  if (error) throw error;
  return data as ContentNode[];
}

export async function fetchNode(slug: string): Promise<ContentNode | null> {
  const { data, error } = await supabase
    .from("content_nodes")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as ContentNode;
}

export async function fetchPath(slug: string): Promise<ContentNode[]> {
  const path: ContentNode[] = [];
  let current = await fetchNode(slug);
  while (current) {
    path.unshift(current);
    if (!current.parent_id) break;
    const parent = await supabase
      .from("content_nodes")
      .select("*")
      .eq("id", current.parent_id)
      .single();
    if (parent.data) current = parent.data as ContentNode;
    else break;
  }
  return path;
}

export async function fetchSiblings(node: ContentNode): Promise<ContentNode[]> {
  if (!node.parent_id) return [];
  const { data, error } = await supabase
    .from("content_nodes")
    .select("*")
    .eq("parent_id", node.parent_id)
    .order("position");
  if (error) return [];
  return data as ContentNode[];
}

export async function countDescendants(nodeId: string): Promise<number> {
  const { count, error } = await supabase
    .from("content_nodes")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", nodeId);
  if (error) return 0;
  return count || 0;
}

export async function fetchAllLessons(): Promise<ContentNode[]> {
  const { data, error } = await supabase
    .from("content_nodes")
    .select("*")
    .eq("type", "lesson")
    .order("position");
  if (error) throw error;
  return data as ContentNode[];
}

export async function fetchCachedSlugs(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("generated_content")
    .select("node_slug")
    .eq("content_type", "full_lesson");
  if (error) return new Set();
  return new Set((data || []).map((d: any) => d.node_slug));
}

export async function fetchCachedLesson(slug: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("generated_content")
    .select("payload")
    .eq("node_slug", slug)
    .eq("content_type", "full_lesson")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0].payload;
}
