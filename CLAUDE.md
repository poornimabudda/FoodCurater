# CLAUDE.md — Dish Curator

## What This Project Is

A dish-level food recommendation app. Not a restaurant review app. The core question it answers:
> "What specific dish should I order here, and why?"

Users called **curators** post recommendations for dishes they personally tasted. Other users browse to decide what to order. Trust signals (personally tasted, curator type, ratings) differentiate this from generic reviews.

---

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend/DB:** Supabase (Postgres + Auth + Storage)
- **Auth:** Supabase magic link (email OTP)
- **Storage:** Supabase Storage — bucket name is `food_images` (public)
- **Deploy:** Vercel
- **Icons:** Lucide React

**Live URL:** https://food-curator.vercel.app  
**Supabase project ref:** `fxkvvlawuqtmgomfcssf`

---

## Environment Variables

All secrets live in `.env.local` (never commit this file):

```
NEXT_PUBLIC_SUPABASE_URL=https://fxkvvlawuqtmgomfcssf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VERCEL_TOKEN=...
```

---

## Project Structure

```
src/
  app/
    page.tsx                      # Home feed — search + filters (cuisine, price, spice, veg)
    layout.tsx                    # Nav: home, profile, recommend
    auth/page.tsx                 # Magic link sign-in
    profile/page.tsx              # Create/edit curator profile
    recommendations/new/page.tsx  # Post a dish recommendation
    dishes/[id]/page.tsx          # Dish detail page
    restaurants/[id]/page.tsx     # Restaurant detail page (all dishes at that location)
  components/
    DishCard.tsx                  # Card shown in feed — links to dish + restaurant detail
    SetupNotice.tsx               # Shown when Supabase env vars are missing
  lib/
    supabase.ts                   # Supabase client init
    types.ts                      # TypeScript types for all DB tables + dish_feed view
    constants.ts                  # curatorTypes[], starterTags[]
supabase/
  migrations/
    001_initial_mvp.sql           # All tables, RLS, storage policies, seed taste_tags
    002_increment2_views.sql      # Recreates dish_feed view with restaurant_id + curator_id
```

---

## Database Schema (Supabase Postgres)

All tables have RLS enabled. Anon users can read everything public.

| Table | Purpose |
|---|---|
| `profiles` | Curator profiles — display_name, city, curator_type, bio |
| `restaurants` | Restaurant records — name, address, city, cuisine |
| `dish_recommendations` | Core post — dish_name, description, rating, spice_level, price_estimate, is_vegetarian, is_personally_tasted, image_url |
| `taste_tags` | 13 preset tags: spicy, mild, vegetarian, vegan, sweet, oily, crispy, creamy, must_try, avoid, good_value, chef_special, kid_friendly |
| `dish_recommendation_tags` | Many-to-many: dish ↔ tags |
| `dish_likes` | user_id + dish_recommendation_id (PK) |
| `saved_dishes` | user_id + dish_recommendation_id (PK) |
| `content_reports` | reporter_id, dish_recommendation_id, reason, status |

**View: `dish_feed`** — denormalized feed used by home feed and restaurant detail page. Columns: `id, dish_name, description, rating, price_estimate, is_personally_tasted, is_vegetarian, spice_level, image_url, created_at, restaurant_id, curator_id, restaurant_name, restaurant_city, cuisine, curator_name, curator_type, tags[]`

**Storage:** `food_images` bucket (public). Path pattern: `{recommendation_id}/{timestamp}.{ext}`

---

## Increment Status

| Increment | Status | Notes |
|---|---|---|
| 0 — Setup | Done | Next.js, Tailwind, Supabase wired |
| 1 — Curator Posting MVP | Done | Auth, profile, post recommendation, home feed |
| 2 — Dish Discovery | Done | Dish detail, restaurant detail, advanced filters (cuisine/price/spice/veg) |
| 3 — Curator Trust Layer | **Next** | See below |
| 4 — Saved Dishes & Collections | Pending | DB tables exist, no UI yet |
| 5 — AI Assistant | Future | Deferred until content exists |

---

## Increment 3 — Curator Trust Layer (Next to Build)

**Goal:** Help users understand why a curator is trustworthy.

### Features to build:

**Backend (Supabase):**
- Add `like_count` and `save_count` to `dish_feed` view (count from `dish_likes` and `saved_dishes`)
- No new tables needed — `dish_likes`, `saved_dishes`, `content_reports` already exist

**Frontend:**
- `/curators/[id]` page — public curator profile showing: display_name, city, curator_type, bio, dish count, list of their recommendations
- Like button on DishCard and dish detail page (toggle like, show count)
- Save button on DishCard and dish detail page (toggle save, show count)
- Report button on dish detail page (modal with reason field)
- Show dish count on DishCard curator attribution line

### Migration needed:
```sql
-- 003_increment3_trust.sql
-- Update dish_feed view to include like_count and save_count
drop view if exists public.dish_feed;
create view public.dish_feed as
select
  dr.id, dr.dish_name, dr.description, dr.rating, dr.price_estimate,
  dr.is_personally_tasted, dr.is_vegetarian, dr.spice_level, dr.image_url, dr.created_at,
  dr.restaurant_id, dr.curator_id,
  r.name as restaurant_name, r.city as restaurant_city, r.cuisine,
  p.display_name as curator_name, p.curator_type,
  coalesce(array_agg(tt.name) filter (where tt.name is not null), '{}') as tags,
  (select count(*) from public.dish_likes dl where dl.dish_recommendation_id = dr.id) as like_count,
  (select count(*) from public.saved_dishes sd where sd.dish_recommendation_id = dr.id) as save_count
from public.dish_recommendations dr
join public.restaurants r on r.id = dr.restaurant_id
join public.profiles p on p.id = dr.curator_id
left join public.dish_recommendation_tags drt on drt.dish_recommendation_id = dr.id
left join public.taste_tags tt on tt.id = drt.taste_tag_id
group by dr.id, r.id, p.id;
```

---

## Deployment

Deploy from Bash (not PowerShell — execution policy blocks .ps1 scripts):

```bash
cd "c:/Users/poorn/OneDrive/Documents/AI Hobby Projects/food-curator"
npx vercel deploy --prod \
  --token <VERCEL_TOKEN from .env.local> \
  --scope poornimabudda-3872s-projects \
  --yes
```

After deploy, re-point the alias:
```bash
curl -X POST "https://api.vercel.com/v2/deployments/<deployment_id>/aliases" \
  -H "Authorization: Bearer <VERCEL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"alias": "food-curator.vercel.app"}'
```

---

## Engineering Rules (from AGENTS.md)

1. Focus on **dishes**, not restaurants — always preserve dish-level value prop
2. No paid services without explicit approval
3. No complex recommendation algorithms until Increment 5
4. Keep code clean and modular — no unnecessary abstractions
5. AI features (Gemini Flash / OpenRouter) only after content validation
6. Use Supabase free tier — zero-cost MVP

## Shell Note

PowerShell blocks npm/npx `.ps1` scripts due to execution policy. Always run npm/npx/vercel commands via **Bash** (Git Bash), not PowerShell terminal.
