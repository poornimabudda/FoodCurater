# CLAUDE.md — Dish Curator

## What This Project Is

A dish-level food recommendation app. Not a restaurant review app. The core question it answers:
> "What specific dish should I order here, and why?"

Users called **curators** post recommendations for dishes they personally tasted. Other users browse to decide what to order. Trust signals (personally tasted, curator type, ratings, expertise badges) differentiate this from generic reviews.

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
    page.tsx                      # Home feed — search + filters + WelcomeBanner
    layout.tsx                    # Nav: how-it-works, saved, profile, recommend
    how-it-works/page.tsx         # Two-tab guide for browsers and curators + FAQ
    auth/page.tsx                 # Magic link sign-in
    profile/page.tsx              # Create/edit curator profile
    recommendations/new/page.tsx  # Post a dish recommendation (with multi-image upload)
    dishes/[id]/page.tsx          # Dish detail — gallery, stats, pairs, tags, curator
    restaurants/[id]/page.tsx     # All dishes at a restaurant
    curators/[id]/page.tsx        # Curator profile — bio, expertise badges, dish grid
    saved/page.tsx                # User's saved dishes
  components/
    DishCard.tsx                  # Feed card — image, rating, tags, course type
    ImageUploader.tsx             # Multi-image upload (up to 4, compress, make-primary)
    WelcomeBanner.tsx             # First-visit onboarding banner (localStorage gated)
    LikeSaveButtons.tsx           # Like + save toggle buttons
    ReportModal.tsx               # Content report modal
    SetupNotice.tsx               # Shown when Supabase env vars are missing
  lib/
    supabase.ts                   # Supabase client init
    types.ts                      # TypeScript types for all DB tables + dish_feed view
    constants.ts                  # curatorTypes[], courseTypes[], tagGroups[], starterTags[]
supabase/
  migrations/
    001_initial_mvp.sql           # All tables, RLS, storage policies, seed taste_tags
    002_increment2_views.sql      # Recreates dish_feed with restaurant_id + curator_id
    003_increment3_trust.sql      # dish_feed with like_count, save_count, curator_dish_count
    004_security_fixes.sql        # Public SELECT on likes/saves; security_invoker on view
    005_enhancements.sql          # course_type, pairs_well_with, 9 new taste_tags, view update
    006_dish_images.sql           # dish_images table (multi-image per recommendation)
```

---

## Database Schema (Supabase Postgres)

All tables have RLS enabled. Anon users can read everything public.

| Table | Purpose |
|---|---|
| `profiles` | Curator profiles — display_name, city, curator_type, bio |
| `restaurants` | Restaurant records — name, address, city, cuisine |
| `dish_recommendations` | Core post — dish_name, description, rating, spice_level, price_estimate, is_vegetarian, is_personally_tasted, image_url (primary), course_type, pairs_well_with |
| `dish_images` | Up to 4 images per recommendation — url, position (0 = primary) |
| `taste_tags` | 22 tags across Taste Profile / Dietary & Allergen / Context groups |
| `dish_recommendation_tags` | Many-to-many: dish ↔ tags |
| `dish_likes` | user_id + dish_recommendation_id (PK) |
| `saved_dishes` | user_id + dish_recommendation_id (PK) |
| `content_reports` | reporter_id, dish_recommendation_id, reason, status |

**View: `dish_feed`** — denormalized feed. Columns include `course_type`, `pairs_well_with`, `like_count`, `save_count`, `curator_dish_count`, `tags[]`.

**Storage:** `food_images` bucket (public). Path: `{recommendation_id}/{position}_{timestamp}.jpg`  
Images are compressed client-side to max 1500px / JPEG 0.82 before upload. Min 600px required.

---

## Tag Groups (constants.ts)

| Group | Tags |
|---|---|
| Taste Profile | spicy, mild, sweet, oily, crispy, creamy |
| Dietary & Allergen | vegetarian, vegan, gluten_free, dairy_free, nut_free, halal, kosher, keto_friendly |
| Context | must_try, avoid, good_value, chef_special, kid_friendly, great_for_sharing, huge_portion, light_bite |

---

## Increment Status

| Increment | Status | Notes |
|---|---|---|
| 0 — Setup | Done | Next.js, Tailwind, Supabase wired |
| 1 — Curator Posting MVP | Done | Auth, profile, post recommendation, home feed |
| 2 — Dish Discovery | Done | Dish detail, restaurant detail, advanced filters |
| 3 — Curator Trust Layer | Done | Likes, saves, reports, /curators/[id] |
| 4 — Saved Dishes | Done | /saved page, nav link |
| Enhancements | Done | Allergen tags, course type, pairs well with, curator badges, cuisine hint |
| Multi-image & Onboarding | Done | ImageUploader (4 photos, compress), gallery, WelcomeBanner, /how-it-works |
| 5 — AI Assistant | Future | Deferred until content exists |

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
