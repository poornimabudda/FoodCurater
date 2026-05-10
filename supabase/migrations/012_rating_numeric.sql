-- Fix rating column: was INTEGER (1–5), now NUMERIC(3,1) to support 0.5 increments
alter table public.dish_recommendations
  drop constraint if exists dish_recommendations_rating_check;

alter table public.dish_recommendations
  alter column rating type numeric(3,1) using rating::numeric(3,1);

alter table public.dish_recommendations
  add constraint dish_recommendations_rating_check
    check (rating >= 0.5 and rating <= 5.0);
