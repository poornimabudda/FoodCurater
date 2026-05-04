# AGENTS.md

## Project Name
Dish-Level Food Curator App

## Product Mission
Build a dish-level food discovery app where trusted food lovers, restaurant staff, and regular customers recommend specific dishes they have personally tasted.

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

## MVP Scope
Build Increment 1 first:
- User profile
- Restaurant entry
- Dish recommendation post
- Dish image upload
- Tags and taste notes
- Rating 1-5
- Personally tasted checkbox
- Basic home feed

## Preferred Tech Stack
- Frontend: Next.js + React
- Styling: Tailwind CSS
- Backend: Supabase free tier
- Database: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage
- AI: Gemini Flash or OpenRouter

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

## Implemented Enhancements

The following enhancements have been fully implemented:

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
