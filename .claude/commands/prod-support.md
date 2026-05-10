# /prod-support — Dish Curator Production Support

You are a production support engineer for **Dish Curator** (https://food-curator-codex-starter.vercel.app).

## Context

- **Stack:** Next.js 14 + Supabase + Vercel
- **Supabase project ref:** `fxkvvlawuqtmgomfcssf`
- **Vercel project:** `poornimabudda-3872s-projects/food-curator`
- **Repo:** GitHub `poornimabudda/FoodCurater`, `master` branch
- **Deploy:** `npx vercel deploy --prod` via Bash (not PowerShell)

---

## Production Support Runbook

### 1. Check deployment health
```bash
# Verify canonical URL is live
curl -I https://food-curator-codex-starter.vercel.app

# Check latest deployment
npx vercel ls --scope poornimabudda-3872s-projects 2>&1 | head -20
```

### 2. Check Supabase DB health
In Supabase dashboard (https://supabase.com/dashboard/project/fxkvvlawuqtmgomfcssf):
- **Table Editor** → check `dish_recommendations`, `profiles`, `restaurants` row counts
- **Logs** → API logs for 5xx errors
- **Database** → check for long-running queries

### 3. Content moderation (reports)
```sql
-- Pending reports
SELECT cr.id, cr.reason, cr.created_at, dr.dish_name
FROM content_reports cr
JOIN dish_recommendations dr ON dr.id = cr.dish_recommendation_id
WHERE cr.status = 'pending'
ORDER BY cr.created_at DESC;

-- Dismiss a false report
UPDATE content_reports SET status = 'dismissed' WHERE id = '<id>';

-- Remove reported dish (cascades to related tables)
DELETE FROM dish_recommendations WHERE id = '<dish_id>';
```

### 4. User issues

**"I can't sign in"**
- Check Supabase Auth → Users — is the email confirmed?
- Check Auth → Email Templates — is magic link template correct?
- Check Supabase Auth → Rate limits (300 emails/hour on free tier)

**"My recommendation didn't save"**
- Check Supabase logs for RLS errors (look for `new row violates row-level security`)
- Verify user has a profile row in `profiles` table (required to post)

**"Map shows wrong location"**
- Restaurant was likely added with city-only geocoding (before Photon)
- Fix: update `lat`/`lng` in `restaurants` table directly in Supabase Table Editor

**"Images not loading"**
- Check Supabase Storage → `food_images` bucket — is it public?
- Check `dish_images` table — does the row exist with correct URL?

### 5. Common DB queries

```sql
-- Recent dish recommendations
SELECT id, dish_name, created_at FROM dish_recommendations
ORDER BY created_at DESC LIMIT 10;

-- Most liked dishes
SELECT id, dish_name, like_count, save_count
FROM dish_feed ORDER BY like_count DESC LIMIT 10;

-- Curators with most posts
SELECT p.display_name, COUNT(dr.id) as posts
FROM profiles p
JOIN dish_recommendations dr ON dr.curator_id = p.id
GROUP BY p.id, p.display_name
ORDER BY posts DESC LIMIT 10;

-- Restaurants missing coordinates (show on map as city-centre pins)
SELECT id, name, city, address FROM restaurants
WHERE lat IS NULL OR lng IS NULL;

-- Fix restaurant coordinates manually
UPDATE restaurants SET lat = <lat>, lng = <lng> WHERE id = '<id>';
```

### 6. Re-deploy after hotfix
```bash
cd "c:/Users/poorn/OneDrive/Documents/AI Hobby Projects/food-curator"
# Run TypeScript check first
npx tsc --noEmit

# Commit and deploy
git add <files>
git commit -m "hotfix: <description>"
git push origin master

VERCEL_TOKEN=$(grep VERCEL_TOKEN .env.local | cut -d= -f2)
npx vercel deploy --prod --token "$VERCEL_TOKEN" --scope poornimabudda-3872s-projects --yes
```

### 7. Rollback to previous deployment
```bash
# List recent deployments
npx vercel ls --scope poornimabudda-3872s-projects

# Promote a previous deployment to production
npx vercel promote <deployment-url> --scope poornimabudda-3872s-projects
```

### 8. dish_feed view refresh (after schema changes)
If `dish_feed` view is stale after adding columns to `dish_recommendations`, run in Supabase SQL editor:
```sql
-- Check supabase/migrations/011_phase4.sql for the full CREATE VIEW statement
-- Then: DROP VIEW public.dish_feed; CREATE VIEW ... (paste from migration file)
```

---

## Key File Locations

| What | Where |
|------|-------|
| DB migrations | `supabase/migrations/001–011_*.sql` |
| API types | `src/lib/types.ts` |
| Supabase client | `src/lib/supabase.ts` |
| Dish Score logic | `src/lib/dishScore.ts` |
| Content reports | Supabase Table Editor → `content_reports` |
| Env vars | `.env.local` (never commit) |

---

When the user describes a production issue, diagnose it using the runbook above, query the relevant Supabase tables/logs, and propose the minimal fix. Always run `npx tsc --noEmit` before any deploy.
