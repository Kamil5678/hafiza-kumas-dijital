import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

export type NodeType = "module" | "submodule" | "lesson" | "topic" | "subtopic";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface ContentNode {
  id: string; parent_id: string | null; type: NodeType; title: string; slug: string;
  description: string | null; position: number; created_at: string;
}

export async function fetchChildren(parentId: string | null): Promise<ContentNode[]> {
  let q = supabase.from("content_nodes").select("id,parent_id,type,title,slug,description,position,created_at").order("position", { ascending: true });
  q = parentId === null ? q.is("parent_id", null) : q.eq("parent_id", parentId);
  const { data, error } = await q; if (error) throw error; return (data ?? []) as ContentNode[];
}
export async function fetchNode(id: string): Promise<ContentNode | null> {
  const { data, error } = await supabase.from("content_nodes").select("id,parent_id,type,title,slug,description,position,created_at").eq("id", id).maybeSingle();
  if (error) throw error; return data as ContentNode | null;
}
export async function fetchRoots(): Promise<ContentNode[]> { return fetchChildren(null); }
export async function fetchPath(id: string): Promise<ContentNode[]> {
  const path: ContentNode[] = []; let cur: string | null = id;
  while (cur) { const n = await fetchNode(cur); if (!n) break; path.unshift(n); cur = n.parent_id; }
  return path;
}
export async function countDescendants(nodeId: string): Promise<number> {
  const { count, error } = await supabase.from("content_nodes").select("id", { count: "exact", head: true }).eq("parent_id", nodeId);
  if (error) throw error; return count ?? 0;
}
export async function fetchSiblings(nodeId: string): Promise<ContentNode[]> {
  const node = await fetchNode(nodeId); if (!node || !node.parent_id) return [];
  const { data, error } = await supabase.from("content_nodes").select("id,parent_id,type,title,slug,description,position,created_at").eq("parent_id", node.parent_id).order("position", { ascending: true });
  if (error) throw error; return (data ?? []) as ContentNode[];
}
