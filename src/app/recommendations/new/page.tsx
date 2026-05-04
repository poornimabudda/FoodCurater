"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImagePlus, Send } from "lucide-react";
import { SetupNotice } from "@/components/SetupNotice";
import { starterTags } from "@/lib/constants";
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setUserId(user?.id ?? null);

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
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  async function resolveRestaurant() {
    if (!supabase || !userId) return null;

    if (selectedRestaurantId) {
      return selectedRestaurantId;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        name: newRestaurantName,
        city: newRestaurantCity || null,
        cuisine: newRestaurantCuisine || null,
        created_by: userId
      })
      .select("id")
      .single<{ id: string }>();

    if (error) throw error;
    return data.id;
  }

  async function uploadDishImage(recommendationId: string) {
    if (!supabase || !imageFile) return null;

    const extension = imageFile.name.split(".").pop() || "jpg";
    const path = `${recommendationId}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("food_images").upload(path, imageFile, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("food_images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveRecommendation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId) return;

    setSaving(true);
    setMessage("");

    try {
      const restaurantId = await resolveRestaurant();
      if (!restaurantId) throw new Error("Choose or add a restaurant.");

      const { data: recommendation, error: recommendationError } = await supabase
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
          is_personally_tasted: isPersonallyTasted
        })
        .select("id")
        .single<{ id: string }>();

      if (recommendationError) throw recommendationError;

      const imageUrl = await uploadDishImage(recommendation.id);
      if (imageUrl) {
        const { error } = await supabase.from("dish_recommendations").update({ image_url: imageUrl }).eq("id", recommendation.id);
        if (error) throw error;
      }

      if (selectedTags.length > 0) {
        const { data: tags, error: tagError } = await supabase
          .from("taste_tags")
          .select("id, name")
          .in("name", selectedTags)
          .returns<Pick<TasteTagRow, "id" | "name">[]>();
        if (tagError) throw tagError;

        const rows = (tags ?? []).map((tag) => ({
          dish_recommendation_id: recommendation.id,
          taste_tag_id: tag.id
        }));
        const { error } = await supabase.from("dish_recommendation_tags").insert(rows);
        if (error) throw error;
      }

      setMessage("Recommendation posted. It will appear in the feed.");
      setDishName("");
      setDescription("");
      setSelectedTags([]);
      setImageFile(null);
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
        <form className="mt-6 grid gap-5 rounded-md border border-black/10 bg-white p-6 shadow-soft" onSubmit={saveRecommendation}>
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">Restaurant</h2>
            <select className="rounded-md border border-black/15 px-3 py-2" value={selectedRestaurantId} onChange={(event) => setSelectedRestaurantId(event.target.value)}>
              <option value="">Add a new restaurant</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name} {restaurant.city ? `- ${restaurant.city}` : ""}
                </option>
              ))}
            </select>
            {!selectedRestaurantId ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <input className="rounded-md border border-black/15 px-3 py-2" placeholder="Restaurant name" value={newRestaurantName} onChange={(event) => setNewRestaurantName(event.target.value)} required />
                <input className="rounded-md border border-black/15 px-3 py-2" placeholder="City" value={newRestaurantCity} onChange={(event) => setNewRestaurantCity(event.target.value)} />
                <input className="rounded-md border border-black/15 px-3 py-2" placeholder="Cuisine" value={newRestaurantCuisine} onChange={(event) => setNewRestaurantCuisine(event.target.value)} />
              </div>
            ) : null}
          </section>

          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">Dish</h2>
            <input className="rounded-md border border-black/15 px-3 py-2" placeholder="Dish name" value={dishName} onChange={(event) => setDishName(event.target.value)} required />
            <textarea className="min-h-28 rounded-md border border-black/15 px-3 py-2" placeholder="Short taste notes: texture, spice, portion, why you recommend it" value={description} onChange={(event) => setDescription(event.target.value)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">
                Rating
                <input type="number" min="1" max="5" className="rounded-md border border-black/15 px-3 py-2" value={rating} onChange={(event) => setRating(Number(event.target.value))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Price estimate
                <input type="number" min="0" step="0.01" className="rounded-md border border-black/15 px-3 py-2" value={priceEstimate} onChange={(event) => setPriceEstimate(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Spice level
                <input type="number" min="0" max="5" className="rounded-md border border-black/15 px-3 py-2" value={spiceLevel} onChange={(event) => setSpiceLevel(Number(event.target.value))} />
              </label>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isVegetarian} onChange={(event) => setIsVegetarian(event.target.checked)} />
                Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isPersonallyTasted} onChange={(event) => setIsPersonallyTasted(event.target.checked)} />
                Personally tasted
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Taste tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {starterTags.map((tag) => (
                <button type="button" className={`rounded-md px-3 py-2 text-sm font-semibold ${selectedTags.includes(tag) ? "bg-basil text-white" : "bg-black/5 text-ink"}`} key={tag} onClick={() => toggleTag(tag)}>
                  {tag.replace("_", " ")}
                </button>
              ))}
            </div>
          </section>

          <label className="grid cursor-pointer gap-2 rounded-md border border-dashed border-black/25 p-4 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <ImagePlus size={18} />
              Dish image
            </span>
            <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
          </label>

          <button className="inline-flex w-fit items-center gap-2 rounded-md bg-tomato px-4 py-2 font-semibold text-white" disabled={saving}>
            <Send size={18} />
            {saving ? "Posting..." : "Post recommendation"}
          </button>
          {message ? <p className="text-sm text-ink/70">{message}</p> : null}
        </form>
      ) : null}
    </main>
  );
}
