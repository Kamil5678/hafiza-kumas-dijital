/*
# Create content tree for the knowledge base

1. Purpose
- Store the full hierarchy of the education platform: Modules -> Submodules -> Lessons -> Topics -> Subtopics.
- Single self-referential table with a `type` discriminator and an optional `parent_id`.
- Single-tenant app (no sign-in requested): data is intentionally public/shared, so policies use `TO anon, authenticated` with `USING (true)`.

2. New Tables
- `content_nodes`
  - `id` uuid primary key (default gen_random_uuid())
  - `parent_id` uuid nullable, self-referential FK to `content_nodes(id)` ON DELETE CASCADE
  - `type` text NOT NULL — one of: module, submodule, lesson, topic, subtopic
  - `title` text NOT NULL
  - `slug` text NOT NULL UNIQUE — globally unique human-readable identifier used to look up parents during seeding
  - `description` text nullable
  - `position` integer NOT NULL DEFAULT 0 — ordering among siblings
  - `created_at` timestamptz default now()
- Index on `parent_id` for child lookups
- Index on `type` for filtered queries
- Index on `slug` (unique) for parent resolution

3. Helper Function
- `add_node(p_parent_slug, p_type, p_title, p_slug, p_description)` — inserts a node under the parent identified by slug (NULL for top-level), returns the new id. Used by the seed step.

4. Security
- RLS enabled on `content_nodes`.
- Four policies (select/insert/update/delete) scoped `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because the content tree is intentionally public reference data for this no-auth app.
*/

CREATE TABLE IF NOT EXISTS content_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES content_nodes(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('module','submodule','lesson','topic','subtopic')),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_nodes_parent ON content_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_nodes_type ON content_nodes(type);

ALTER TABLE content_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_content_nodes" ON content_nodes;
CREATE POLICY "anon_select_content_nodes" ON content_nodes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_content_nodes" ON content_nodes;
CREATE POLICY "anon_insert_content_nodes" ON content_nodes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_content_nodes" ON content_nodes;
CREATE POLICY "anon_update_content_nodes" ON content_nodes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_content_nodes" ON content_nodes;
CREATE POLICY "anon_delete_content_nodes" ON content_nodes FOR DELETE
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION add_node(
  p_parent_slug text,
  p_type text,
  p_title text,
  p_slug text,
  p_description text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_parent_id uuid;
  v_id uuid;
  v_pos integer;
BEGIN
  IF p_parent_slug IS NULL THEN
    v_parent_id := NULL;
  ELSE
    SELECT id INTO v_parent_id FROM content_nodes WHERE slug = p_parent_slug;
    IF v_parent_id IS NULL THEN
      RAISE EXCEPTION 'Parent not found for slug: %', p_parent_slug;
    END IF;
  END IF;

  SELECT COALESCE(MAX(position),0)+1 INTO v_pos FROM content_nodes WHERE parent_id IS NOT DISTINCT FROM v_parent_id;

  INSERT INTO content_nodes (parent_id, type, title, slug, description, position)
  VALUES (v_parent_id, p_type, p_title, p_slug, p_description, v_pos)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
