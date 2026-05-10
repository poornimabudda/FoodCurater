# AGENTS.md — Dish Curator

> AI agent instructions. Read CLAUDE.md for full project context and engineering rules.

## Project Name
Dish-Level Food Curator App

## Product Mission
A dish-level food discovery app where trusted food lovers recommend specific dishes they personally tasted.  
**Live:** https://food-curator-codex-starter.vercel.app  
**Stack:** Next.js 14 · Supabase · TypeScript · Tailwind CSS · Vercel (all current — MVP is deployed and live)

This is not a generic restaurant review app. The product should help users answer one question quickly:

> What should I order here or nearby based on my taste preferences?

## Core Product Principles
1. Focus on dishes, not restaurants.
2. Prioritize trusted human recommendations over anonymous reviews.
3. Keep the MVP simple and zero-cost where possible.
4. Build incrementally and validate before adding complex AI features.
5. Do not build a Yelp clone.

## Target MVP User Types
- Food Curator: Someone who posts dish recommendations.
- Customer: Someone searching for what to order.
- Admin / Moderator: Later role for trust and content quality.

## Current Implementation Status (as of 2026-05-10)
All MVP increments + Phase 2 + Phase 3 + Phase 4 + QA fixes shipped and live. See CLAUDE.md Feature Status table for complete list.

**Key recent additions:**
- Dish Score: derived from rating + tags (must_try +0.3, good_value +0.2, chef_special +0.2, personally_tasted +0.1, avoid -0.5), rounded to 0.5 steps
- Photon typeahead: free restaurant address autocomplete in wizard Step 2 (photon.komoot.io)
- All mutations have optimistic UI with error revert
- Auth `?returnTo` param preserved through magic-link flow

## Tech Stack (current)
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Supabase free tier (Postgres + Auth + Storage)
- Auth: Supabase magic link (email OTP)
- Deploy: Vercel
- Icons: Lucide React
- Map: Leaflet + react-leaflet + OpenStreetMap
- Restaurant autocomplete: Photon API (photon.komoot.io) — free, no API key
- Fallback geocoding: Nominatim (rate limit 1 req/sec)
- AI: Deferred to Increment 5

## Critical Agent Rules
1. **No paid services** without explicit user approval
2. **Never commit** `.env.local` or secrets
3. **Deploy via Bash** — PowerShell execution policy blocks .ps1
4. **`dish_feed` view** must be DROP + CREATE when `dish_recommendations` gets new columns
5. **`Map` icon clash** — lucide-react `Map` shadows global `Map` type; use `Record<string,number>` not `new Map<>()`
6. **`npx tsc --noEmit`** must pass before every commit
7. **New text inputs** must have `maxLength`
8. **Auth-gated actions** must check `user` before any DB write

## Engineering Guidelines
- Keep code clean, modular, and easy to extend.
- Avoid unnecessary abstractions.
- Prefer simple database schema and clear naming.
- Add comments only where they clarify intent.
- Do not introduce paid services without explicit approval.
- Do not add complex recommendation algorithms in Increment 1.

## Naming Guidelines
Use clear business terms:
- curator
- restaurant
- dish
- dish_recommendation
- taste_tag
- saved_dish
- dish_image

## Definition of Done for Increment 1
- A user can sign up or sign in.
- A user can create/edit a basic profile.
- A user can add a restaurant.
- A user can create a dish recommendation.
- A user can upload a dish image.
- A user can see a feed of dish recommendations.
- Data is persisted in Supabase.
- README includes setup steps.

## Phase 2: Commercial Enhancements

The following Phase 2 enhancements have been fully implemented to improve discoverability, retention, and mobile UX:

1. **SEO — SSR + OG Meta Tags:** Dish detail, restaurant, and curator pages converted to Server Components with `generateMetadata()` for dynamic Open Graph tags. Pages are indexable by Google and show rich previews when shared on social media.

2. **Feed Pagination + Infinite Scroll:** Home feed uses cursor-based pagination (20 dishes/page). Intersection observer triggers next page load. Eliminates loading all dishes at once.

3. **Follow System:** `follows` table in DB. `FollowButton` component on curator profiles. "Following" tab on home feed shows only dishes from followed curators.

4. **Multi-step Post Wizard:** Recommendations form split into 3 steps — "Where did you eat?", "Tell us about the dish", "Photos & tags". Dramatically reduces perceived friction on mobile.

5. **Map Discovery:** `/map` page with Leaflet + OpenStreetMap showing restaurant markers. Clicking a marker previews dishes at that restaurant. No API key required.

6. **Dish Detail Visual Polish:** Star rating row (filled/empty stars), improved stat cards, "Similar dishes" section at the bottom (same restaurant or shared tags).

7. **Curator Dashboard:** `/dashboard` page showing total likes, saves, views, top dish by engagement, and posting streak. Only visible to authenticated curator.

8. **Restaurant Claiming:** "Claim this restaurant" button on restaurant pages. Submits to `restaurant_claim_requests` table. `is_verified` badge shown when approved.

9. **Trending Sort:** Feed "Trending" tab ranks dishes by (likes + saves) in the last 7 days. Computed from existing `dish_likes` and `saved_dishes` tables.

10. **Onboarding CTAs:** Post-first-login nudge ("Post your first dish!") shown on home feed when user has 0 posts. Dish detail pages show "Have you tried this? Post your take." CTA for logged-in users with 0 posts.

### New DB Tables (migration 007)
- `follows` (follower_id, following_id, created_at)
- `dish_view_counts` (dish_recommendation_id, view_count, last_viewed_at)
- `restaurant_claim_requests` (id, restaurant_id, requester_id, message, status, created_at)
- `is_verified` boolean column on `restaurants`

---

## Implemented Enhancements (Phase 1)

The following Phase 1 enhancements have been fully implemented:

1. **Allergens & Strict Diets:** Tags expanded with Gluten-Free, Dairy-Free, Nut-Free, Halal, Kosher, Keto-Friendly. Tags are now organized into three groups: Taste Profile, Dietary & Allergen, Context.
2. **Course Type & Portion Context:** `course_type` column on `dish_recommendations` (appetizer, main_course, side, dessert, beverage). Context tags added: great_for_sharing, huge_portion, light_bite.
3. **Curator Specializations:** Expertise badges auto-computed client-side on `/curators/[id]` from tag/cuisine frequency across the curator's recommendations (threshold: 2+).
4. **The "Perfect Pairing":** `pairs_well_with` text field on `dish_recommendations`, shown as a callout on dish detail.
5. **Cuisine Granularity:** Cuisine input placeholder updated to prompt regional specificity (e.g. "Sichuan, not just Chinese").
6. **Multi-Image Upload:** Curators can upload up to 4 photos per recommendation. Images are compressed client-side (max 1500px, JPEG 0.82) and stored in `dish_images` table. Primary image mirrored to `dish_recommendations.image_url` for feed queries. Gallery shown on dish detail with hero + thumbnail strip.
7. **Onboarding & Help:** First-visit WelcomeBanner (localStorage gated), `/how-it-works` page with two-persona tabs (browser / curator) and FAQ, nav "How it works" link.

## Future AI Direction
Add AI only after content validation. Future features may include:
- Natural language dish search
- Personalized taste matching
- Image-based dish recognition
- Curator trust scoring
- Recommendation explanations

## Important Product Warning
If the app becomes only "reviews + photos," it will not be differentiated. Always preserve the core value proposition: trusted, dish-level recommendations from real food curators.

---

## Agent Quick-Reference: Key Patterns

### Optimistic Mutation Pattern (LikeSaveButtons, FollowButton, collections)
```typescript
// 1. Update UI state immediately
setState(newValue);
// 2. Await DB call
const { error } = await supabase.from(...).insert/delete/upsert(...);
// 3. Revert on error
if (error) { setState(oldValue); showError("Could not save. Try again."); }
```

### Auth Check Pattern (TriedItButton)
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) { window.location.href = "/auth"; return; }
```

### Photon Autocomplete Response Shape
```typescript
// GET https://photon.komoot.io/api/?q=QUERY&limit=5&layer=poi
{
  features: [{
    geometry: { coordinates: [lng, lat] },  // NOTE: [lng, lat] order
    properties: {
      name, housenumber, street, city, state, country, country_code
    }
  }]
}
```

### PostgREST FK Disambiguation
```typescript
// When a table has multiple FK relations to another table:
supabase.from("dish_recommendations").select(`
  restaurant:restaurants!restaurant_id(id, name, city),
  curator:profiles!curator_id(id, display_name)
`)
```

### Dish Score Formula
```typescript
import { computeDishScore } from "@/lib/dishScore";
const score = computeDishScore(dish.rating, dish.tags ?? [], dish.is_personally_tasted);
// Returns 0.5–5.0 in 0.5 steps
```

### Migrations
Never auto-run. List the SQL, explain the change, ask user to run in Supabase dashboard → SQL editor.

### Deploy Command (Bash only)
```bash
cd "c:/Users/poorn/OneDrive/Documents/AI Hobby Projects/food-curator"
VERCEL_TOKEN=$(grep VERCEL_TOKEN .env.local | cut -d= -f2)
npx vercel deploy --prod --token "$VERCEL_TOKEN" --scope poornimabudda-3872s-projects --yes
```
