-- Multi-image support for dish recommendations
-- Each recommendation can have up to 4 images.
-- position 0 = primary/hero (also mirrored to dish_recommendations.image_url for feed queries).

create table public.dish_images (
  id                      uuid primary key default gen_random_uuid(),
  dish_recommendation_id  uuid not null references public.dish_recommendations(id) on delete cascade,
  url                     text not null,
  position                integer not null default 0,
  created_at              timestamptz default now()
);

create index dish_images_rec_position_idx
  on public.dish_images (dish_recommendation_id, position);

alter table public.dish_images enable row level security;

create policy "dish images are publicly readable"
  on public.dish_images for select using (true);

create policy "curators can insert images for their own recommendations"
  on public.dish_images for insert
  with check (
    exists (
      select 1 from public.dish_recommendations dr
      where dr.id = dish_recommendation_id
        and dr.curator_id = auth.uid()
    )
  );

create policy "curators can delete their own dish images"
  on public.dish_images for delete
  using (
    exists (
      select 1 from public.dish_recommendations dr
      where dr.id = dish_recommendation_id
        and dr.curator_id = auth.uid()
    )
  );
