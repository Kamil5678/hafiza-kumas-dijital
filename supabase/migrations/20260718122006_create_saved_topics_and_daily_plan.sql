/*
# Create saved_topics and daily_plan tables (single-tenant, no auth)

1. Purpose
- Persist topic packages the user generates and saves.
- Distribute saved topics across a daily study plan (one topic per day).

2. New Tables
- `saved_packages`: a named bundle of topics the user chose to save.
- `saved_topics`: individual topics belonging to a saved package.
- `daily_plan`: a day-by-day assignment of a saved topic to a date.

3. Security
- Enable RLS on all three tables.
- No-sign-in single-tenant app, so policies use TO anon, authenticated
  with USING (true) / WITH CHECK (true) because data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS saved_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  size int NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_saved_packages" ON saved_packages;
CREATE POLICY "anon_select_saved_packages" ON saved_packages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_saved_packages" ON saved_packages;
CREATE POLICY "anon_insert_saved_packages" ON saved_packages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_saved_packages" ON saved_packages;
CREATE POLICY "anon_update_saved_packages" ON saved_packages
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_saved_packages" ON saved_packages;
CREATE POLICY "anon_delete_saved_packages" ON saved_packages
  FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS saved_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES saved_packages(id) ON DELETE CASCADE,
  topic_id int NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  position int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_topics_package_id ON saved_topics(package_id);

ALTER TABLE saved_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_saved_topics" ON saved_topics;
CREATE POLICY "anon_select_saved_topics" ON saved_topics
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_saved_topics" ON saved_topics;
CREATE POLICY "anon_insert_saved_topics" ON saved_topics
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_saved_topics" ON saved_topics;
CREATE POLICY "anon_update_saved_topics" ON saved_topics
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_saved_topics" ON saved_topics;
CREATE POLICY "anon_delete_saved_topics" ON saved_topics
  FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS daily_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES saved_packages(id) ON DELETE CASCADE,
  saved_topic_id uuid NOT NULL REFERENCES saved_topics(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  scheduled_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_daily_plan_package_id ON daily_plan(package_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_saved_topic_id ON daily_plan(saved_topic_id);

ALTER TABLE daily_plan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_daily_plan" ON daily_plan;
CREATE POLICY "anon_select_daily_plan" ON daily_plan
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_daily_plan" ON daily_plan;
CREATE POLICY "anon_insert_daily_plan" ON daily_plan
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_daily_plan" ON daily_plan;
CREATE POLICY "anon_update_daily_plan" ON daily_plan
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_daily_plan" ON daily_plan;
CREATE POLICY "anon_delete_daily_plan" ON daily_plan
  FOR DELETE TO anon, authenticated USING (true);
