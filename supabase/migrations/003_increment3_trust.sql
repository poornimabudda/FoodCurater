-- Increment 3: Curator Trust Layer
-- Extends dish_feed view with like_count, save_count, curator_dish_count

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
  r.name    as restaurant_name,
  r.city    as restaurant_city,
  r.cuisine,
  p.display_name as curator_name,
  p.curator_type,
  coalesce(array_agg(tt.name) filter (where tt.name is not null), '{}') as tags,
  (select count(*) from public.dish_likes    dl where dl.dish_recommendation_id = dr.id)      as like_count,
  (select count(*) from public.saved_dishes  sd where sd.dish_recommendation_id = dr.id)      as save_count,
  (select count(*) from public.dish_recommendations cr where cr.curator_id = dr.curator_id)   as curator_dish_count
from public.dish_recommendations dr
join  public.restaurants r  on r.id = dr.restaurant_id
join  public.profiles    p  on p.id = dr.curator_id
left join public.dish_recommendation_tags  drt on drt.dish_recommendation_id = dr.id
left join public.taste_tags                tt  on tt.id  = drt.taste_tag_id
group by dr.id, r.id, p.id;
