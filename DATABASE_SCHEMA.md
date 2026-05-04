# Database Schema Draft

Target database: Supabase Postgres

## profiles
Stores user profile information.

Columns:
- id uuid primary key references auth.users(id)
- display_name text not null
- bio text
- city text
- curator_type text
- avatar_url text
- created_at timestamptz default now()
- updated_at timestamptz default now()

Example curator_type values:
- foodie
- restaurant_staff
- vegetarian_expert
- spicy_food_lover
- casual_user

## restaurants
Stores restaurant information.

Columns:
- id uuid primary key default gen_random_uuid()
- name text not null
- address text
- city text
- state text
- country text default 'USA'
- cuisine text
- created_by uuid references profiles(id)
- created_at timestamptz default now()
- updated_at timestamptz default now()

## dish_recommendations
Stores dish-level recommendation posts.

Columns:
- id uuid primary key default gen_random_uuid()
- curator_id uuid references profiles(id) not null
- restaurant_id uuid references restaurants(id) not null
- dish_name text not null
- description text
- rating integer check (rating >= 1 and rating <= 5)
- price_estimate numeric(8,2)
- is_personally_tasted boolean default true
- is_vegetarian boolean
- spice_level integer check (spice_level >= 0 and spice_level <= 5)
- image_url text
- created_at timestamptz default now()
- updated_at timestamptz default now()

## taste_tags
Stores allowed tags.

Columns:
- id uuid primary key default gen_random_uuid()
- name text unique not null

Starter tags:
- spicy
- mild
- vegetarian
- vegan
- sweet
- oily
- crispy
- creamy
- must_try
- avoid
- good_value
- chef_special
- kid_friendly

## dish_recommendation_tags
Many-to-many relationship between recommendations and tags.

Columns:
- dish_recommendation_id uuid references dish_recommendations(id) on delete cascade
- taste_tag_id uuid references taste_tags(id) on delete cascade
- primary key (dish_recommendation_id, taste_tag_id)

## dish_likes
Tracks likes.

Columns:
- user_id uuid references profiles(id) on delete cascade
- dish_recommendation_id uuid references dish_recommendations(id) on delete cascade
- created_at timestamptz default now()
- primary key (user_id, dish_recommendation_id)

## saved_dishes
Tracks saved dishes.

Columns:
- user_id uuid references profiles(id) on delete cascade
- dish_recommendation_id uuid references dish_recommendations(id) on delete cascade
- created_at timestamptz default now()
- primary key (user_id, dish_recommendation_id)

## content_reports
Allows users to report questionable content.

Columns:
- id uuid primary key default gen_random_uuid()
- reporter_id uuid references profiles(id)
- dish_recommendation_id uuid references dish_recommendations(id)
- reason text not null
- status text default 'open'
- created_at timestamptz default now()

## Row Level Security Notes
Enable RLS for all user-owned tables.

Initial policy direction:
- Anyone can read public profiles, restaurants, and dish recommendations.
- Authenticated users can insert their own profile and recommendations.
- Users can update/delete only their own content.
- Admin/moderator features should be added later.
