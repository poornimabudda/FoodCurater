-- Migration 011: Phase 4 additions
-- 1. highlight text field on dish_recommendations ("what makes this dish special here")
-- 2. availability enum on dish_recommendations (all_day / lunch / dinner / seasonal / weekend)
-- 3. Recreate dish_feed view to expose both new columns

ALTER TABLE public.dish_recommendations
  ADD COLUMN IF NOT EXISTS highlight     text,
  ADD COLUMN IF NOT EXISTS availability  text
    CHECK (availability IN ('all_day', 'lunch', 'dinner', 'seasonal', 'weekend'));

-- Recreate view with highlight + availability
DROP VIEW IF EXISTS public.dish_feed;

CREATE VIEW public.dish_feed WITH (security_invoker = on) AS
SELECT
  dr.id,
  dr.dish_name,
  dr.description,
  dr.rating,
  dr.price_estimate,
  dr.is_personally_tasted,
  dr.is_vegetarian,
  dr.spice_level,
  dr.image_url,
  dr.created_at,
  dr.course_type,
  dr.pairs_well_with,
  dr.highlight,
  dr.availability,
  dr.restaurant_id,
  dr.curator_id,
  r.name         AS restaurant_name,
  r.city         AS restaurant_city,
  r.cuisine,
  p.display_name AS curator_name,
  p.curator_type,
  COALESCE(array_agg(tt.name) FILTER (WHERE tt.name IS NOT NULL), '{}') AS tags,
  (SELECT count(*) FROM public.dish_likes   dl WHERE dl.dish_recommendation_id = dr.id)     AS like_count,
  (SELECT count(*) FROM public.saved_dishes sd WHERE sd.dish_recommendation_id = dr.id)     AS save_count,
  (SELECT count(*) FROM public.dish_recommendations cr WHERE cr.curator_id = dr.curator_id) AS curator_dish_count
FROM public.dish_recommendations dr
JOIN  public.restaurants r  ON r.id = dr.restaurant_id
JOIN  public.profiles    p  ON p.id = dr.curator_id
LEFT JOIN public.dish_recommendation_tags drt ON drt.dish_recommendation_id = dr.id
LEFT JOIN public.taste_tags               tt  ON tt.id  = drt.taste_tag_id
GROUP BY dr.id, r.id, p.id;
