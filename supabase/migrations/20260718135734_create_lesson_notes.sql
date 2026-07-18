/*
# Create lesson_notes table for per-lesson user notes

1. Purpose
- Store free-text notes that users attach to a lesson.
- Keyed by node_slug; multiple notes per lesson allowed.

2. New Tables
- `lesson_notes`
  - `id` uuid PK
  - `node_slug` text NOT NULL
  - `note` text NOT NULL
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now()

3. Indexes
- idx_lesson_notes_slug on node_slug

4. Security
- RLS enabled, anon + authenticated CRUD (no-auth app).
*/

CREATE TABLE IF NOT EXISTS lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_slug text NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_slug ON lesson_notes(node_slug);

ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lesson_notes" ON lesson_notes;
CREATE POLICY "anon_select_lesson_notes" ON lesson_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lesson_notes" ON lesson_notes;
CREATE POLICY "anon_insert_lesson_notes" ON lesson_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lesson_notes" ON lesson_notes;
CREATE POLICY "anon_update_lesson_notes" ON lesson_notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lesson_notes" ON lesson_notes;
CREATE POLICY "anon_delete_lesson_notes" ON lesson_notes FOR DELETE
  TO anon, authenticated USING (true);
