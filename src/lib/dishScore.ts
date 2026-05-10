export function computeDishScore(
  rating: number,
  tags: string[],
  isPersonallyTasted: boolean | null
): number {
  let bonus = 0;
  if (tags.includes("must_try"))    bonus += 0.3;
  if (tags.includes("good_value"))  bonus += 0.2;
  if (tags.includes("chef_special")) bonus += 0.2;
  if (isPersonallyTasted)           bonus += 0.1;
  if (tags.includes("avoid"))       bonus -= 0.5;
  bonus = Math.min(0.5, Math.max(-0.5, bonus));
  const raw = rating + bonus;
  return Math.min(5.0, Math.max(0.5, Math.round(raw * 2) / 2));
}
