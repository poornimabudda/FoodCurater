-- Migration 007: Phase 2 commercial enhancements
-- Tables: follows, dish_view_counts, restaurant_claim_requests
-- Column: restaurants.is_verified

-- ── follows ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ── dish_view_counts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dish_view_counts (
  dish_recommendation_id uuid PRIMARY KEY REFERENCES dish_recommendations(id) ON DELETE CASCADE,
  view_count             integer NOT NULL DEFAULT 0,
  last_viewed_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dish_view_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view view counts"
  ON dish_view_counts FOR SELECT USING (true);

-- Service role only for upserts (called from API route)
CREATE POLICY "Service role can upsert view counts"
  ON dish_view_counts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── restaurant_claim_requests ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurant_claim_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  requester_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message       text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE restaurant_claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit claim requests"
  ON restaurant_claim_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view their own claim requests"
  ON restaurant_claim_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- ── restaurants.is_verified ───────────────────────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx  ON follows(follower_id);
