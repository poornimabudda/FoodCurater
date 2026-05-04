-- Increment 2: update dish_feed view to expose restaurant_id and curator_id
-- so the frontend can link to /dishes/[id] and /restaurants/[id]

drop view if exists public.dish_feed;

create view public.dish_feed as
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
  r.name  as restaurant_name,
  r.city  as restaurant_city,
  r.cuisine,
  p.display_name as curator_name,
  p.curator_type,
  coalesce(array_agg(tt.name) filter (where tt.name is not null), '{}') as tags
from public.dish_recommendations dr
join public.restaurants  r on r.id = dr.restaurant_id
join public.profiles     p on p.id = dr.curator_id
left join public.dish_recommendation_tags drt on drt.dish_recommendation_id = dr.id
left join public.taste_tags tt on tt.id = drt.taste_tag_id
group by dr.id, r.id, p.id;
