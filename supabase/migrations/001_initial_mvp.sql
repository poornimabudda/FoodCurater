create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  city text,
  curator_type text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  country text default 'USA',
  cuisine text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dish_recommendations (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid references public.profiles(id) on delete cascade not null,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  dish_name text not null,
  description text,
  rating integer check (rating >= 1 and rating <= 5),
  price_estimate numeric(8, 2),
  is_personally_tasted boolean default true,
  is_vegetarian boolean,
  spice_level integer check (spice_level >= 0 and spice_level <= 5),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taste_tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists public.dish_recommendation_tags (
  dish_recommendation_id uuid references public.dish_recommendations(id) on delete cascade,
  taste_tag_id uuid references public.taste_tags(id) on delete cascade,
  primary key (dish_recommendation_id, taste_tag_id)
);

create table if not exists public.dish_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  dish_recommendation_id uuid references public.dish_recommendations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dish_recommendation_id)
);

create table if not exists public.saved_dishes (
  user_id uuid references public.profiles(id) on delete cascade,
  dish_recommendation_id uuid references public.dish_recommendations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dish_recommendation_id)
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id),
  dish_recommendation_id uuid references public.dish_recommendations(id),
  reason text not null,
  status text default 'open',
  created_at timestamptz not null default now()
);

insert into public.taste_tags (name)
values
  ('spicy'),
  ('mild'),
  ('vegetarian'),
  ('vegan'),
  ('sweet'),
  ('oily'),
  ('crispy'),
  ('creamy'),
  ('must_try'),
  ('avoid'),
  ('good_value'),
  ('chef_special'),
  ('kid_friendly')
on conflict (name) do nothing;

create or replace view public.dish_feed as
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
  r.name as restaurant_name,
  r.city as restaurant_city,
  r.cuisine,
  p.display_name as curator_name,
  p.curator_type,
  coalesce(array_agg(tt.name) filter (where tt.name is not null), '{}') as tags
from public.dish_recommendations dr
join public.restaurants r on r.id = dr.restaurant_id
join public.profiles p on p.id = dr.curator_id
left join public.dish_recommendation_tags drt on drt.dish_recommendation_id = dr.id
left join public.taste_tags tt on tt.id = drt.taste_tag_id
group by dr.id, r.id, p.id;

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.dish_recommendations enable row level security;
alter table public.taste_tags enable row level security;
alter table public.dish_recommendation_tags enable row level security;
alter table public.dish_likes enable row level security;
alter table public.saved_dishes enable row level security;
alter table public.content_reports enable row level security;

create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "restaurants are publicly readable" on public.restaurants for select using (true);
create policy "authenticated users create restaurants" on public.restaurants for insert to authenticated with check (auth.uid() = created_by);
create policy "creators update restaurants" on public.restaurants for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "recommendations are publicly readable" on public.dish_recommendations for select using (true);
create policy "curators create recommendations" on public.dish_recommendations for insert to authenticated with check (auth.uid() = curator_id);
create policy "curators update recommendations" on public.dish_recommendations for update using (auth.uid() = curator_id) with check (auth.uid() = curator_id);
create policy "curators delete recommendations" on public.dish_recommendations for delete using (auth.uid() = curator_id);

create policy "tags are publicly readable" on public.taste_tags for select using (true);

create policy "recommendation tags are publicly readable" on public.dish_recommendation_tags for select using (true);
create policy "curators manage own recommendation tags" on public.dish_recommendation_tags
for all to authenticated
using (
  exists (
    select 1 from public.dish_recommendations dr
    where dr.id = dish_recommendation_id and dr.curator_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.dish_recommendations dr
    where dr.id = dish_recommendation_id and dr.curator_id = auth.uid()
  )
);

create policy "users manage own likes" on public.dish_likes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own saved dishes" on public.saved_dishes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "authenticated users report content" on public.content_reports for insert to authenticated with check (auth.uid() = reporter_id);

insert into storage.buckets (id, name, public)
values ('food_images', 'food_images', true)
on conflict (id) do nothing;

create policy "food images are publicly readable" on storage.objects for select using (bucket_id = 'food_images');
create policy "authenticated users upload food images" on storage.objects for insert to authenticated with check (bucket_id = 'food_images');
create policy "authenticated users update food images" on storage.objects for update to authenticated using (bucket_id = 'food_images') with check (bucket_id = 'food_images');
