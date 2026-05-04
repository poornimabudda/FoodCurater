-- Enhancements migration
-- 1. Dietary & allergen tags + portion/context tags
-- 2. course_type column on dish_recommendations
-- 3. pairs_well_with column on dish_recommendations
-- 4. Recreate dish_feed view with new columns

-- New taste tags
insert into public.taste_tags (name) values
  ('gluten_free'),
  ('dairy_free'),
  ('nut_free'),
  ('halal'),
  ('kosher'),
  ('keto_friendly'),
  ('great_for_sharing'),
  ('huge_portion'),
  ('light_bite')
on conflict (name) do nothing;

-- New columns on dish_recommendations
alter table public.dish_recommendations
  add column if not exists course_type text
    check (course_type in ('appetizer', 'main_course', 'side', 'dessert', 'beverage')),
  add column if not exists pairs_well_with text;

-- Recreate dish_feed to expose the new columns
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
  dr.course_type,
  dr.pairs_well_with,
  dr.restaurant_id,
  dr.curator_id,
  r.name         as restaurant_name,
  r.city         as restaurant_city,
  r.cuisine,
  p.display_name as curator_name,
  p.curator_type,
  coalesce(array_agg(tt.name) filter (where tt.name is not null), '{}') as tags,
  (select count(*) from public.dish_likes   dl where dl.dish_recommendation_id = dr.id)         as like_count,
  (select count(*) from public.saved_dishes sd where sd.dish_recommendation_id = dr.id)         as save_count,
  (select count(*) from public.dish_recommendations cr where cr.curator_id = dr.curator_id)     as curator_dish_count
from public.dish_recommendations dr
join  public.restaurants r  on r.id = dr.restaurant_id
join  public.profiles    p  on p.id = dr.curator_id
left join public.dish_recommendation_tags drt on drt.dish_recommendation_id = dr.id
left join public.taste_tags               tt  on tt.id  = drt.taste_tag_id
group by dr.id, r.id, p.id;
