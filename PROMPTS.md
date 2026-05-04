# Codex Prompts

## Prompt 1: Create Initial Project
Create a Next.js + Supabase MVP for a dish-level food curator app.

Product concept:
Users can recommend specific dishes they personally tasted at restaurants, with photos, taste notes, tags, and ratings. Other users can search for dishes based on taste preference, cuisine, budget, and location.

Build Increment 1 only:
- User profile
- Add restaurant
- Add dish recommendation
- Upload dish image
- Tags: spicy, vegetarian, sweet, oily, must-try, avoid
- Rating 1-5
- Personally tasted checkbox
- Basic home feed of recommended dishes

Also create or follow:
- AGENTS.md
- PRODUCT_BLUEPRINT.md
- MVP_ROADMAP.md
- DATABASE_SCHEMA.md
- USER_STORIES.md
- README.md

Use Supabase free tier.
Do not add paid services.
Keep architecture simple and production-clean.

## Prompt 2: Generate Supabase SQL
Using DATABASE_SCHEMA.md, create SQL migration scripts for Supabase Postgres.

Requirements:
- Create all MVP tables.
- Enable Row Level Security.
- Add policies for authenticated users to manage their own records.
- Add read policies for public dish feed.
- Add seed data for taste tags.

## Prompt 3: Build Dish Recommendation Form
Build the dish recommendation form for Increment 1.

Fields:
- Restaurant selector or add restaurant
- Dish name
- Description
- Rating 1-5
- Price estimate
- Vegetarian flag
- Spice level 0-5
- Personally tasted checkbox
- Tags multi-select
- Image upload to Supabase Storage

## Prompt 4: Build Home Feed
Build a public home feed showing dish recommendations.

Each card should show:
- Dish image
- Dish name
- Restaurant name
- Cuisine
- City
- Rating
- Tags
- Curator display name
- Personally tasted badge

Sort by newest first.

## Prompt 5: Add Basic Search and Filters
Add search and filters to the home feed.

Filters:
- Dish name search
- Cuisine
- City
- Vegetarian
- Spice level
- Tags

Keep the implementation simple.

## Prompt 6: Add README Setup Steps
Update README.md with exact local setup instructions.

Include:
- Install dependencies
- Create Supabase project
- Add environment variables
- Run database migration
- Start local dev server
