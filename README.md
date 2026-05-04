# Dish Curator MVP

Dish Curator is a dish-level food recommendation app. The focus is not generic restaurant reviews. Each post should answer one practical question:

> What dish should I order, and why?

This repository now contains an Increment 1 MVP scaffold built with Next.js, Tailwind CSS, and Supabase.

## What is included

- Public home feed for dish recommendations
- Email magic-link sign-in page
- Curator profile page
- New dish recommendation form
- Restaurant creation inside the recommendation flow
- Dish image upload to Supabase Storage
- Taste tags, rating, vegetarian flag, spice level, personally tasted flag
- Supabase SQL migration with RLS policies and starter tags

## Project structure

- `src/app` - Next.js App Router pages
- `src/components` - reusable UI pieces
- `src/lib` - Supabase client, constants, and types
- `supabase/migrations/001_initial_mvp.sql` - initial database setup

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment file

Create `/.env.local` in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the SQL migration in Supabase

Open the Supabase dashboard for your project:

1. Go to `SQL Editor`
2. Open `supabase/migrations/001_initial_mvp.sql`
3. Run the script contents

This migration creates:

- profiles
- restaurants
- dish_recommendations
- taste_tags
- dish_recommendation_tags
- dish_likes
- saved_dishes
- content_reports
- public `dish_feed` view
- storage bucket `dish-images`
- initial row-level security policies

### 4. Configure Supabase auth

In Supabase:

1. Go to `Authentication`
2. Enable email sign-in / magic links
3. Add your local dev URL to redirect URLs

Recommended local URL:

```bash
http://localhost:3000/profile
```

### 5. Start the app

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Current routes

- `/` - public feed
- `/auth` - magic-link sign-in
- `/profile` - create or edit curator profile
- `/recommendations/new` - create a dish recommendation

## Important notes

- The app expects a public Supabase storage bucket named `dish-images`.
- The home feed reads from the SQL view `dish_feed`.
- If `.env.local` is missing or invalid, the UI shows a setup notice instead of trying to connect.
- The current MVP does not yet include likes, saves, restaurant detail pages, or advanced filters.

## Recommended next build steps

1. Run the SQL migration in Supabase
2. Start the dev server and test sign-in
3. Create a profile
4. Add one restaurant and one dish recommendation
5. Verify the post appears on the home feed
6. Add likes, saves, and richer filters in the next increment

## Related docs

- `AGENTS.md`
- `PRODUCT_BLUEPRINT.md`
- `MVP_ROADMAP.md`
- `DATABASE_SCHEMA.md`
- `USER_STORIES.md`
- `PROMPTS.md`
