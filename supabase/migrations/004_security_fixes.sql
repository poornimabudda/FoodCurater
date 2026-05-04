-- Security fixes for Increment 3
--
-- Fix 1: like_count and save_count in dish_feed were always 0 for every user.
--   Root cause: the existing "for all to authenticated using (auth.uid() = user_id)"
--   policy on dish_likes/saved_dishes also restricts SELECT, so even an authenticated
--   user's subquery in the view only counts their own row, not the total.
--   Adding a public SELECT policy gives the view accurate counts while keeping
--   INSERT/UPDATE/DELETE locked to the owning user.
--   Privacy note: profiles are already publicly readable, so exposing like/save counts
--   (and which user liked which dish) is consistent with the app's data model.

create policy "likes are publicly readable"
  on public.dish_likes for select using (true);

create policy "saved dishes are publicly readable"
  on public.saved_dishes for select using (true);

-- Fix 2: recreate dish_feed with security_invoker = on.
--   Without this, the view can run as the definer role on some Postgres versions,
--   potentially bypassing RLS on base tables for callers who have view-level SELECT
--   but should not have direct table access.

drop view if exists public.dish_feed;

create view public.dish_feed with (security_invoker = on) as
select
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
  dr.restaurant_id,
  dr.curator_id,
  r.name         as restaurant_name,
  r.city         as restaurant_city,
  r.cuisine,
  p.display_name as curator_name,
  p.curator_type,
  coalesce(array_agg(tt.name) filter (where tt.name is not null), '{}') as tags,
  (select count(*) from public.dish_likes   dl where dl.dish_recommendation_id = dr.id)    as like_count,
  (select count(*) from public.saved_dishes sd where sd.dish_recommendation_id = dr.id)    as save_count,
  (select count(*) from public.dish_recommendations cr where cr.curator_id = dr.curator_id) as curator_dish_count
from public.dish_recommendations dr
join  public.restaurants r  on r.id = dr.restaurant_id
join  public.profiles    p  on p.id = dr.curator_id
left join public.dish_recommendation_tags drt on drt.dish_recommendation_id = dr.id
left join public.taste_tags               tt  on tt.id  = drt.taste_tag_id
group by dr.id, r.id, p.id;
