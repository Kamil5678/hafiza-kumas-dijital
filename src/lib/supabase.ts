import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

export type NodeType = "module" | "submodule" | "lesson" | "topic" | "subtopic";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface ContentNode {
  id: string;
  parent_id: string | null;
  type: NodeType;
  title: string;
  slug: string;
  description: string | null;
  position: number;
  created_at: string;
}

export async function fetchChildren(parentId: string | null): Promise<ContentNode[]> {
  let query = supabase
    .from("content_nodes")
    .select("id, parent_id, type, title, slug, description, position, created_at")
    .order("position", { ascending: true });
  if (parentId === null) {
    query = query.is("parent_id", null);
  } else {
    query = query.eq("parent_id", parentId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ContentNode[];
}

export async function fetchNode(id: string): Promise<ContentNode | null> {
  const { data, error } = await supabase
    .from("content_nodes")
    .select("id, parent_id, type, title, slug, description, position, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ContentNode | null;
}

export async function fetchRoots(): Promise<ContentNode[]> {
  return fetchChildren(null);
}

export async function fetchPath(id: string): Promise<ContentNode[]> {
  const path: ContentNode[] = [];
  let current: string | null = id;
  while (current) {
    const node = await fetchNode(current);
    if (!node) break;
    path.unshift(node);
    current = node.parent_id;
  }
  return path;
}

export async function countDescendants(nodeId: string): Promise<number> {
  const { count, error } = await supabase
    .from("content_nodes")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", nodeId);
  if (error) throw error;
  return count ?? 0;
}
