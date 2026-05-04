"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { ImageUploader, type ImagePreview } from "@/components/ImageUploader";
import { SetupNotice } from "@/components/SetupNotice";
import { courseTypes, tagGroups } from "@/lib/constants";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { RestaurantRow, TasteTagRow } from "@/lib/types";

type Restaurant = Pick<RestaurantRow, "id" | "name" | "city" | "cuisine">;

export default function NewRecommendationPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantCity, setNewRestaurantCity] = useState("");
  const [newRestaurantCuisine, setNewRestaurantCuisine] = useState("");
  const [dishName, setDishName] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(5);
  const [priceEstimate, setPriceEstimate] = useState("");
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [isPersonallyTasted, setIsPersonallyTasted] = useState(true);
  const [courseType, setCourseType] = useState("");
  const [pairsWellWith, setPairsWellWith] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadImages, setUploadImages] = useState<ImagePreview[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!supabase) { setLoading(false); return; }
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData.user?.id ?? null);
      const { data } = await supabase
        .from("restaurants")
        .select("id, name, city, cuisine")
        .order("name")
        .returns<Restaurant[]>();
      setRestaurants(data ?? []);
      setLoading(false);
    }
    loadData();
  }, []);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function resolveRestaurant() {
    if (!supabase || !userId) return null;
    if (selectedRestaurantId) return selectedRestaurantId;
    const { data, error } = await supabase
      .from("restaurants")
      .insert({ name: newRestaurantName, city: newRestaurantCity || null, cuisine: newRestaurantCuisine || null, created_by: userId })
      .select("id")
      .single<{ id: string }>();
    if (error) throw error;
    return data.id;
  }

  async function uploadAllImages(recommendationId: string) {
    if (!supabase || uploadImages.length === 0) return [];
    const results: { url: string; position: number }[] = [];
    for (let i = 0; i < uploadImages.length; i++) {
      const img = uploadImages[i];
      const path = `${recommendationId}/${i}_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("food_images").upload(path, img.file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("food_images").getPublicUrl(path);
      results.push({ url: data.publicUrl, position: i });
    }
    return results;
  }

  async function saveRecommendation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId) return;
    if (uploadImages.length === 0) { setMessage("Add at least one photo before posting."); return; }
    if (uploadImages.some((img) => img.error)) { setMessage("Fix photo errors before posting."); return; }

    setSaving(true);
    setMessage("");

    try {
      const restaurantId = await resolveRestaurant();
      if (!restaurantId) throw new Error("Choose or add a restaurant.");

      const { data: recommendation, error: recError } = await supabase
        .from("dish_recommendations")
        .insert({
          curator_id: userId,
          restaurant_id: restaurantId,
          dish_name: dishName,
          description,
          rating,
          price_estimate: priceEstimate ? Number(priceEstimate) : null,
          is_vegetarian: isVegetarian,
          spice_level: spiceLevel,
          is_personally_tasted: isPersonallyTasted,
          course_type: courseType || null,
          pairs_well_with: pairsWellWith || null,
        })
        .select("id")
        .single<{ id: string }>();
      if (recError) throw recError;

      const imageResults = await uploadAllImages(recommendation.id);
      if (imageResults.length > 0) {
        // Mirror primary URL back to dish_recommendations for feed queries
        await supabase.from("dish_recommendations").update({ image_url: imageResults[0].url }).eq("id", recommendation.id);
        await supabase.from("dish_images").insert(
          imageResults.map((r) => ({ dish_recommendation_id: recommendation.id, url: r.url, position: r.position }))
        );
      }

      if (selectedTags.length > 0) {
        const { data: tags, error: tagError } = await supabase
          .from("taste_tags")
          .select("id, name")
          .in("name", selectedTags)
          .returns<Pick<TasteTagRow, "id" | "name">[]>();
        if (tagError) throw tagError;
        const { error } = await supabase.from("dish_recommendation_tags").insert(
          (tags ?? []).map((tag) => ({ dish_recommendation_id: recommendation.id, taste_tag_id: tag.id }))
        );
        if (error) throw error;
      }

      setMessage("Recommendation posted. It will appear in the feed.");
      setDishName(""); setDescription(""); setCourseType(""); setPairsWellWith("");
      setSelectedTags([]); setUploadImages([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save recommendation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-ink">Recommend a dish</h1>
      <p className="mt-2 text-ink/70">Focus on what someone should order and why it is worth trying.</p>

      {!isSupabaseConfigured ? <div className="mt-6"><SetupNotice /></div> : null}
      {loading ? <p className="mt-6 text-ink/60">Loading form...</p> : null}
      {!loading && isSupabaseConfigured && !userId ? (
        <div className="mt-6 rounded-md border border-black/10 bg-white p-6 shadow-soft">
          <p className="font-semibold text-ink">Sign in before posting a recommendation.</p>
          <Link className="mt-3 inline-flex rounded-md bg-ink px-4 py-2 font-semibold text-white" href="/auth">Go to sign in</Link>
        </div>
      ) : null}

      {userId ? (
        <form className="mt-6 grid gap-6 rounded-md border border-black/10 bg-white p-6 shadow-soft" onSubmit={saveRecommendation}>

          {/* Restaurant */}
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">Restaurant</h2>
            <select className="rounded-md border border-black/15 px-3 py-2" value={selectedRestaurantId} onChange={(e) => setSelectedRestaurantId(e.target.value)}>
              <option value="">Add a new restaurant</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.city ? ` - ${r.city}` : ""}</option>
              ))}
            </select>
            {!selectedRestaurantId && (
              <div className="grid gap-4 sm:grid-cols-3">
                <input className="rounded-md border border-black/15 px-3 py-2" placeholder="Restaurant name" value={newRestaurantName} onChange={(e) => setNewRestaurantName(e.target.value)} required />
                <input className="rounded-md border border-black/15 px-3 py-2" placeholder="City" value={newRestaurantCity} onChange={(e) => setNewRestaurantCity(e.target.value)} />
                <input
                  className="rounded-md border border-black/15 px-3 py-2"
                  placeholder="Cuisine (e.g. Sichuan, not just Chinese)"
                  value={newRestaurantCuisine}
                  onChange={(e) => setNewRestaurantCuisine(e.target.value)}
                  title="Be specific — e.g. Neapolitan, Sichuan, Kerala, Oaxacan"
                />
              </div>
            )}
          </section>

          {/* Dish details */}
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">Dish</h2>
            <input className="rounded-md border border-black/15 px-3 py-2" placeholder="Dish name" value={dishName} onChange={(e) => setDishName(e.target.value)} required />
            <textarea className="min-h-28 rounded-md border border-black/15 px-3 py-2" placeholder="Short taste notes: texture, spice, portion, why you recommend it" value={description} onChange={(e) => setDescription(e.target.value)} />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Course type
                <select className="rounded-md border border-black/15 px-3 py-2 font-normal" value={courseType} onChange={(e) => setCourseType(e.target.value)}>
                  <option value="">Not specified</option>
                  {courseTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Pairs well with
                <input className="rounded-md border border-black/15 px-3 py-2 font-normal" placeholder="e.g. garlic naan, mango lassi" value={pairsWellWith} onChange={(e) => setPairsWellWith(e.target.value)} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">
                Rating
                <input type="number" min="1" max="5" className="rounded-md border border-black/15 px-3 py-2" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Price estimate ($)
                <input type="number" min="0" step="0.01" className="rounded-md border border-black/15 px-3 py-2" value={priceEstimate} onChange={(e) => setPriceEstimate(e.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Spice level (0–5)
                <input type="number" min="0" max="5" className="rounded-md border border-black/15 px-3 py-2" value={spiceLevel} onChange={(e) => setSpiceLevel(Number(e.target.value))} />
              </label>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isVegetarian} onChange={(e) => setIsVegetarian(e.target.checked)} />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isPersonallyTasted} onChange={(e) => setIsPersonallyTasted(e.target.checked)} />
                Personally tasted
              </label>
            </div>
          </section>

          {/* Tags */}
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">Tags</h2>
            {tagGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`rounded-md px-3 py-1.5 text-sm font-semibold ${selectedTags.includes(tag) ? "bg-basil text-white" : "bg-black/5 text-ink"}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Images */}
          <ImageUploader images={uploadImages} onChange={setUploadImages} />

          <button
            className="inline-flex w-fit items-center gap-2 rounded-md bg-tomato px-4 py-2 font-semibold text-white disabled:opacity-60"
            disabled={saving}
          >
            <Send size={18} />
            {saving ? "Posting..." : "Post recommendation"}
          </button>
          {message && <p className="text-sm text-ink/70">{message}</p>}
        </form>
      ) : null}
    </main>
  );
}
