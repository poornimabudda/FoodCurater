-- Migration 010: Batch B tables
-- 1. dish_tries — personal food diary (loved it / okay / would skip)
-- 2. collections — named dish lists
-- 3. collection_items — dishes in a collection

-- ── dish_tries ───────────────────────────────────────────────────────────────
CREATE TABLE dish_tries (
  user_id                 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dish_recommendation_id  uuid NOT NULL REFERENCES dish_recommendations(id) ON DELETE CASCADE,
  status                  text NOT NULL CHECK (status IN ('loved_it', 'okay', 'skip')),
  created_at              timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, dish_recommendation_id)
);
ALTER TABLE dish_tries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tries" ON dish_tries
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── collections ──────────────────────────────────────────────────────────────
CREATE TABLE collections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view collections"         ON collections FOR SELECT USING (true);
CREATE POLICY "Users can manage their own collections" ON collections FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── collection_items ─────────────────────────────────────────────────────────
CREATE TABLE collection_items (
  collection_id           uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  dish_recommendation_id  uuid NOT NULL REFERENCES dish_recommendations(id) ON DELETE CASCADE,
  added_at                timestamptz DEFAULT now(),
  PRIMARY KEY (collection_id, dish_recommendation_id)
);
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view collection items" ON collection_items FOR SELECT USING (true);
CREATE POLICY "Users can manage items in their own collections" ON collection_items FOR ALL
  USING  (collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid()))
  WITH CHECK (collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid()));
