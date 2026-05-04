# User Stories

## Epic 1: User Profile

### Story 1.1: Create Curator Profile
As a food curator, I want to create a profile so that users can understand my food preferences and credibility.

Acceptance Criteria:
- User can enter display name.
- User can enter city.
- User can select curator type.
- User can add a short bio.
- Profile is saved in the database.

### Story 1.2: View Curator Profile
As a customer, I want to view a curator profile so that I can decide whether to trust their recommendations.

Acceptance Criteria:
- Profile page shows display name, city, curator type, and bio.
- Profile page shows curator's dish recommendations.

## Epic 2: Restaurant Management

### Story 2.1: Add Restaurant
As a curator, I want to add a restaurant so that I can associate dish recommendations with it.

Acceptance Criteria:
- User can enter restaurant name.
- User can enter city and cuisine.
- Restaurant is saved in the database.

## Epic 3: Dish Recommendation

### Story 3.1: Add Dish Recommendation
As a curator, I want to recommend a dish I personally tasted so that others know what to order.

Acceptance Criteria:
- User can select or add a restaurant.
- User can enter dish name.
- User can add notes.
- User can upload an image.
- User can select tags.
- User can add rating 1-5.
- User can mark personally tasted.
- Recommendation appears in the feed.

### Story 3.2: View Dish Feed
As a customer, I want to see a feed of recommended dishes so that I can discover what to order.

Acceptance Criteria:
- Feed shows dish image, dish name, restaurant, rating, tags, and curator name.
- Most recent recommendations appear first.

## Epic 4: Dish Discovery

### Story 4.1: Search Dishes
As a customer, I want to search dish recommendations so that I can find food matching my preference.

Acceptance Criteria:
- User can search by dish name.
- User can filter by tags.
- User can filter by vegetarian option.

## Epic 5: Trust and Feedback

### Story 5.1: Like Dish Recommendation
As a customer, I want to like a dish recommendation so that useful recommendations become more visible.

Acceptance Criteria:
- Authenticated user can like a dish.
- User can unlike a dish.
- Like count is visible.

### Story 5.2: Save Dish Recommendation
As a customer, I want to save a dish so that I can return to it later.

Acceptance Criteria:
- Authenticated user can save a dish.
- Saved dishes are available in user profile or saved page.
