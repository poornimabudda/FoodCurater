-- Migration 008: Production fixes
-- 1. Fix dish_view_counts RLS — allow public upsert (view counts are not sensitive)
-- 2. Add lat/lng to restaurants for cached geocoding

-- ── dish_view_counts: drop broken service_role-only policy, allow public upsert ──
DROP POLICY IF EXISTS "Service role can upsert view counts" ON dish_view_counts;

CREATE POLICY "Anyone can upsert view counts"
  ON dish_view_counts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update view counts"
  ON dish_view_counts FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── restaurants: add lat/lng for cached geocoding ────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

-- Allow authenticated users to update lat/lng on any restaurant (geocoding cache write)
CREATE POLICY "Authenticated users can update restaurant coordinates"
  ON restaurants FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
