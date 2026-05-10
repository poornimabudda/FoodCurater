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
- **Map:** Leaflet + react-leaflet + OpenStreetMap tiles + Nominatim geocoding
- **Restaurant geocoding:** Photon API (photon.komoot.io) — free, no API key, OSM-powered typeahead in wizard Step 2

**Live URL:** https://food-curator-codex-starter.vercel.app (canonical)  
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
    page.tsx                      # Home feed — tabs, search+autocomplete, filter chips, infinite scroll
    layout.tsx                      # Nav: Map, Explore, How it works, UserMenu (Saved/Dashboard/Profile), Recommend
    how-it-works/page.tsx           # Two-tab guide + feature grid + FAQ (updated for Phase 4)
    auth/page.tsx                   # Magic link sign-in
    profile/page.tsx                # Create/edit curator profile (incl. obsessed_with status)
    recommendations/new/page.tsx    # 3-step post wizard (Dish → Where → Photos & tags) — Step 2 has Photon typeahead for exact restaurant coordinates
    dishes/[id]/page.tsx            # Dish detail — gallery, stats, pairs, tags, curator, share
    restaurants/[id]/page.tsx       # All dishes at a restaurant
    curators/[id]/page.tsx          # Curator profile — bio, active badge, obsessed_with, share, expertise badges
    saved/page.tsx                  # 3-tab page: Want to try / Tried (+ post CTA) / Lists (collections + share)
    dashboard/page.tsx              # Curator analytics + taste profile card
    explore/page.tsx                # Cuisine grid + tag grid → inline filtered feed
    map/page.tsx                    # Map-based dish discovery — viewport-filtered "Dishes in this area" sidebar
    collections/[id]/page.tsx       # Public shareable collection page (SSR + OG meta)
  components/
    DishCard.tsx                    # Feed card — image, rating, tags, active curator dot, share button
    LikeSaveButtons.tsx             # Like + save toggle buttons
    FollowButton.tsx                # Follow/unfollow a curator
    ShareButton.tsx                 # Web Share API + clipboard fallback (path prop, optional label)
    TriedItButton.tsx               # Inline tried-it status picker (loved_it / okay / skip)
    ImageUploader.tsx               # Multi-image upload (up to 4, compress, make-primary)
    MapView.tsx                     # Leaflet map (dynamic import, ssr:false) — emits onBoundsChange
    WelcomeBanner.tsx               # First-visit onboarding banner (localStorage gated)
    ReportModal.tsx                 # Content report modal
    SetupNotice.tsx                 # Shown when Supabase env vars are missing
    NavAuth.tsx                     # UserMenu dropdown (Saved / Dashboard / Profile / Sign out)
  lib/
    supabase.ts                     # Supabase client init
    types.ts                        # TypeScript types for all DB tables + dish_feed view
    constants.ts                    # curatorTypes[], courseTypes[], tagGroups[], starterTags[]
    dishScore.ts                    # computeDishScore(rating, tags, isPersonallyTasted) — Dish Score formula
supabase/
  migrations/
    001_initial_mvp.sql             # All tables, RLS, storage policies, seed taste_tags
    002_increment2_views.sql        # Recreates dish_feed with restaurant_id + curator_id
    003_increment3_trust.sql        # dish_feed with like_count, save_count, curator_dish_count
    004_security_fixes.sql          # Public SELECT on likes/saves; security_invoker on view
    005_enhancements.sql            # course_type, pairs_well_with, 9 new taste_tags, view update
    006_dish_images.sql             # dish_images table (multi-image per recommendation)
    007_phase2.sql                  # follows, dish_view_counts, restaurant_claim_requests, is_verified
    008_fixes.sql                   # View count RLS fix + lat/lng on restaurants
    009_obsessed_with.sql           # profiles.obsessed_with + obsessed_with_updated_at
    010_batch_b.sql                 # dish_tries, collections, collection_items
    011_phase4.sql                  # highlight + availability on dish_recommendations; view update
```

---

## Database Schema (Supabase Postgres)

All tables have RLS enabled. Anon users can read public data.

| Table | Purpose |
|---|---|
| `profiles` | Curator profiles — display_name, city, curator_type, bio, obsessed_with, obsessed_with_updated_at |
| `restaurants` | Restaurant records — name, address, city, cuisine, is_verified, lat, lng |
| `dish_recommendations` | Core post — dish_name, description, rating, spice_level, price_estimate, is_vegetarian, is_personally_tasted, image_url, course_type, pairs_well_with, highlight, availability |
| `dish_images` | Up to 4 images per recommendation — url, position (0 = primary) |
| `taste_tags` | 22 tags across Taste Profile / Dietary & Allergen / Context groups |
| `dish_recommendation_tags` | Many-to-many: dish ↔ tags |
| `dish_likes` | user_id + dish_recommendation_id (PK) |
| `saved_dishes` | user_id + dish_recommendation_id (PK) |
| `content_reports` | reporter_id, dish_recommendation_id, reason, status |
| `follows` | follower_id → following_id (PK) |
| `dish_view_counts` | dish_recommendation_id, view_count, last_viewed_at |
| `restaurant_claim_requests` | restaurant_id, requester_id, message, status |
| `dish_tries` | user_id + dish_recommendation_id (PK), status: loved_it/okay/skip |
| `collections` | id, user_id, name — named dish lists |
| `collection_items` | collection_id + dish_recommendation_id (PK) |

**View: `dish_feed`** — denormalized feed. Columns: all from dish_recommendations + restaurant_name, restaurant_city, cuisine, curator_name, curator_type, tags[], like_count, save_count, curator_dish_count, course_type, pairs_well_with, highlight, availability.

**Storage:** `food_images` bucket (public). Path: `{recommendation_id}/{position}_{timestamp}.jpg`  
Images are compressed client-side to max 1500px / JPEG 0.82. Min 600px required.

---

## Tag Groups (constants.ts)

| Group | Tags |
|---|---|
| Taste Profile | spicy, mild, sweet, oily, crispy, creamy |
| Dietary & Allergen | vegetarian, vegan, gluten_free, dairy_free, nut_free, halal, kosher, keto_friendly |
| Context | must_try, avoid, good_value, chef_special, kid_friendly, great_for_sharing, huge_portion, light_bite |

---

## Feature Status (as of 2026-05-10)

| Phase | Status |
|---|---|
| Increments 0–4 (MVP → saved dishes) | Done |
| Enhancements (tags, course type, pairs, badges, cuisine) | Done |
| Multi-image + onboarding | Done |
| Phase 2 — 10 commercial enhancements | Done |
| Phase 3 Batch A — share, filter chips, active badge, obsessed_with | Done |
| Phase 3 Batch B — tried diary, taste profile, explore, collections, autocomplete | Done |
| Phase 4 — nav dropdown, For you tab, highlight/availability, wizard reorder, collections sharing, trending recency, map viewport, how-it-works | Done |
| QA Bug Fixes — rating overhaul (Dish Score), error handling, validation, streak fix, null safety | Done |
| Map accuracy — Photon typeahead for exact restaurant coordinates in wizard Step 2 | Done |
| Increment 5 — AI assistant | Deferred until real content exists |

---

## Phase 2: Commercial Enhancements (all done)

1. SSR + OG meta tags on dish/restaurant/curator pages
2. Feed pagination + infinite scroll (20/page, cursor-based, IntersectionObserver)
3. Feed tabs: Latest / Trending / Following
4. Follow system (follows table, FollowButton, follower counts)
5. 3-step post wizard (Where → Dish details → Photos & tags)
6. Map discovery (/map, Leaflet + OpenStreetMap + Nominatim)
7. Dish detail polish (star rating, view counter, similar dishes section)
8. Curator dashboard (/dashboard — likes, saves, views, top dish, streak)
9. Restaurant claiming (claim button → restaurant_claim_requests, is_verified badge)
10. Onboarding CTAs for new users on feed + dish detail

## Phase 3: UX Enhancements (all done)

**Batch A:**
- ShareButton: Web Share API + clipboard fallback, on cards / dish detail / curator profile
- Quick-tap filter chips: Spicy / Vegan / Under $20 / ⭐ 4+ above the feed grid
- Active curator badge: green dot on feed cards + profile header, 7-day window, client-side
- "Currently obsessed with": freeform status on profile, displayed on curator page for 7 days

**Batch B:**
- Tried It diary: 3-tab /saved (Want to try / Tried / Lists), TriedItButton (loved_it / okay / skip), dish_tries table
- Collections: named lists in /saved Lists tab, add-to-list picker, collections + collection_items tables
- Taste profile card on /dashboard: top tags + cuisine + price tier from saved dishes
- /explore page: cuisine hero grid + tag pills → inline filtered feed, Explore nav link
- Search autocomplete: dropdown (dish names / cuisines / tags) from loaded dishes, client-side

## Phase 4: Polish & Completion (all done — deployed 2026-05-10)

- Nav consolidation: NavAuth → UserMenu dropdown (Saved / Dashboard / Profile / Sign out); removed from header
- Shareable collections: /collections/[id] public page (SSR + OG meta) + share icon in /saved Lists tab
- Tried tab post CTA: saffron prompt at bottom of Tried tab → /recommendations/new
- highlight field: "What makes this dish special here?" — migration 011, wizard step 1, types
- availability field: all_day/lunch/dinner/seasonal/weekend — migration 011, wizard step 1, types
- Wizard reorder: Dish details (step 1) → Where (step 2) → Photos & tags (step 3)
- Trending recency weighting: client-side trendingScore() resorts 50 fetched dishes
- "For you" tab: 4th feed tab (signed-in only); queries by top saved cuisine + top 2 tags; falls back to latest
- Map viewport filtering: MapView emits onBoundsChange; map page shows "Dishes in this area" filtered by bounds
- How-it-works: fully rewritten — 5 finding steps, 5 recommending steps, feature grid, 10 FAQs

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

The canonical alias `food-curator-codex-starter.vercel.app` is set automatically by the deploy script (Vercel project has it configured as a production alias).

---

## Content Moderation (Reports)

Reports are in `content_reports` (fields: reason, status, reporter_id, dish_recommendation_id). No admin UI yet — manage directly in Supabase:

1. Table Editor → `content_reports` → filter `status = 'pending'`
2. Remove reported dish: delete from `dish_recommendations` (cascades)
3. Dismiss false report: set `status = 'dismissed'`

---

## Key Technical Notes

- **`Map` icon clash:** `lucide-react` exports a `Map` component — never use `new Map<>()` in `page.tsx`; use `Record<string,number>` instead.
- **`dish_feed` view:** Must be DROP + CREATE whenever `dish_recommendations` gains new columns.
- **Photon autocomplete:** `https://photon.komoot.io/api/?q=QUERY&limit=5&layer=poi` — free, no API key, debounced 400ms. Response: `features[].geometry.coordinates = [lng, lat]`, `features[].properties.{name, housenumber, street, city, country_code}`. Selecting a result stores `lat`/`lng` directly; manual field edits clear stored coords so geocoding fallback re-runs on submit.
- **Restaurant `address` field:** Now captured in wizard Step 2 (new `newRestaurantAddress` state). Geocoding uses `"{address}, {city}"` when Photon coords are not available.
- **Dish Score:** `src/lib/dishScore.ts` — `computeDishScore(rating, tags, isPersonallyTasted)`. Rating input `step=0.5`. DishCard shows Dish Score; DishDetailClient shows Dish Score (half-stars) + raw curator rating.
- **Auth `returnTo`:** `auth/page.tsx` reads `?returnTo` query param and passes to `emailRedirectTo`. Links requiring auth should use `/auth?returnTo=/path`.
- **Streak:** Uses absolute epoch-week index (`Math.floor(date.getTime() / (7*24*60*60*1000))`) to avoid year-boundary bugs.
- **MapView:** Dynamic import with `ssr:false`; `onBoundsChange` callback debounced 300ms.
- **"For you" tab:** PostgREST `.or('cuisine.eq.X,tags.ov.{tag1,tag2}')` syntax.
- **Deploy:** Always via Bash (`npx vercel deploy --prod`), not PowerShell.

---

## Engineering Rules

1. **Dishes, not restaurants** — always preserve the dish-level value prop
2. No paid services without explicit approval
3. No complex recommendation algorithms until Increment 5
4. Keep code clean — no unnecessary abstractions
5. AI features only after content validation
6. Supabase free tier — zero-cost MVP
7. Run npm/npx/vercel commands via **Bash**, not PowerShell (execution policy)
