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
