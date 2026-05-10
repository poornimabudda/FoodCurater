// Shared numeric constants — single source of truth
export const PAGE_SIZE = 20;
export const EXPLORE_LOAD_LIMIT = 100;
export const ACTIVE_CURATOR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_IMAGES = 4;
export const IMAGE_MIN_PX = 600;
export const IMAGE_MAX_PX = 1500;

export const AVAILABILITY_OPTIONS = [
  { value: "all_day",  label: "All day" },
  { value: "lunch",    label: "Lunch only" },
  { value: "dinner",   label: "Dinner only" },
  { value: "seasonal", label: "Seasonal" },
  { value: "weekend",  label: "Weekends only" },
] as const;

export const curatorTypes = [
  { value: "foodie", label: "Foodie" },
  { value: "restaurant_staff", label: "Restaurant staff" },
  { value: "vegetarian_expert", label: "Vegetarian expert" },
  { value: "spicy_food_lover", label: "Spicy food lover" },
  { value: "casual_user", label: "Casual user" }
];

export const courseTypes = [
  { value: "appetizer", label: "Appetizer" },
  { value: "main_course", label: "Main Course" },
  { value: "side", label: "Side" },
  { value: "dessert", label: "Dessert" },
  { value: "beverage", label: "Beverage" },
];

export const tagGroups = [
  {
    label: "Taste Profile",
    tags: ["spicy", "mild", "sweet", "oily", "crispy", "creamy"]
  },
  {
    label: "Dietary & Allergen",
    tags: ["vegetarian", "vegan", "gluten_free", "dairy_free", "nut_free", "halal", "kosher", "keto_friendly"]
  },
  {
    label: "Context",
    tags: ["must_try", "avoid", "good_value", "chef_special", "kid_friendly", "great_for_sharing", "huge_portion", "light_bite"]
  }
];

// Flat list kept for backward-compatible tag lookups
export const starterTags = tagGroups.flatMap((g) => g.tags);
