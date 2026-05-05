"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { ImageUploader, type ImagePreview } from "@/components/ImageUploader";
import { SetupNotice } from "@/components/SetupNotice";
import { courseTypes, tagGroups } from "@/lib/constants";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { RestaurantRow, TasteTagRow } from "@/lib/types";

type Restaurant = Pick<RestaurantRow, "id" | "name" | "city" | "cuisine">;
type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Tell us about the dish",
  2: "Where did you eat?",
  3: "Photos & tags",
};

const AVAILABILITY_OPTIONS = [
  { value: "all_day",  label: "All day" },
  { value: "lunch",    label: "Lunch only" },
  { value: "dinner",   label: "Dinner only" },
  { value: "seasonal", label: "Seasonal" },
  { value: "weekend",  label: "Weekends only" },
];

export default function NewRecommendationPage() {
  const [step, setStep] = useState<Step>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // Step 1 — dish
  const [dishName, setDishName] = useState("");
  const [description, setDescription] = useState("");
  const [highlight, setHighlight] = useState("");
  const [rating, setRating] = useState(5);
  const [priceEstimate, setPriceEstimate] = useState("");
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [isPersonallyTasted, setIsPersonallyTasted] = useState(true);
  const [courseType, setCourseType] = useState("");
  const [pairsWellWith, setPairsWellWith] = useState("");
  const [availability, setAvailability] = useState("");

  // Step 2 — restaurant
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantCity, setNewRestaurantCity] = useState("");
  const [newRestaurantCuisine, setNewRestaurantCuisine] = useState("");

  // Step 3 — photos + tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadImages, setUploadImages] = useState<ImagePreview[]>([]);

  const [message, setMessage] = useState("");
  const [newDishId, setNewDishId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!supabase) { setLoading(false); return; }
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setUserId(user?.id ?? null);
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        setHasProfile(!!profileData?.display_name);
        const { data } = await supabase.from("restaurants").select("id, name, city, cuisine").order("name").returns<Restaurant[]>();
        setRestaurants(data ?? []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function step1Valid() {
    return dishName.trim().length > 0;
  }

  function step2Valid() {
    if (selectedRestaurantId) return true;
    return newRestaurantName.trim().length > 0;
  }

  function step3Valid() {
    return uploadImages.length > 0 && !uploadImages.some((img) => img.error);
  }

  async function geocodeAddress(city: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        { headers: { "User-Agent": "DishCurator/1.0" } }
      );
      const data = await res.json();
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch { /* non-fatal */ }
    return null;
  }

  async function resolveRestaurant() {
    if (!supabase || !userId) return null;
    if (selectedRestaurantId) return selectedRestaurantId;

    const geocity = newRestaurantCity || newRestaurantName;
    const coords = geocity ? await geocodeAddress(geocity) : null;

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        name: newRestaurantName,
        city: newRestaurantCity || null,
        cuisine: newRestaurantCuisine || null,
        created_by: userId,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      .select("id").single<{ id: string }>();
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
      if (error) throw new Error(`Photo upload failed: ${error.message}`);
      const { data } = supabase.storage.from("food_images").getPublicUrl(path);
      results.push({ url: data.publicUrl, position: i });
    }
    return results;
  }

  async function submit() {
    if (!supabase || !userId) return;
    setSaving(true);
    setMessage("");
    setNewDishId(null);
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
          highlight: highlight.trim() || null,
          availability: availability || null,
        })
        .select("id").single<{ id: string }>();
      if (recError) throw recError;

      const imageResults = await uploadAllImages(recommendation.id);
      if (imageResults.length > 0) {
        await supabase.from("dish_recommendations").update({ image_url: imageResults[0].url }).eq("id", recommendation.id);
        await supabase.from("dish_images").insert(
          imageResults.map((r) => ({ dish_recommendation_id: recommendation.id, url: r.url, position: r.position }))
        );
      }

      if (selectedTags.length > 0) {
        const { data: tags } = await supabase.from("taste_tags").select("id, name").in("name", selectedTags).returns<Pick<TasteTagRow, "id" | "name">[]>();
        await supabase.from("dish_recommendation_tags").insert(
          (tags ?? []).map((tag) => ({ dish_recommendation_id: recommendation.id, taste_tag_id: tag.id }))
        );
      }

      setNewDishId(recommendation.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save recommendation.");
    } finally {
      setSaving(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isSupabaseConfigured) return <main className="mx-auto max-w-2xl px-4 py-10"><SetupNotice /></main>;
  if (loading) return <main className="mx-auto max-w-2xl px-4 py-10"><p className="text-ink/60">Loading...</p></main>;

  if (!userId) return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-md border border-black/10 bg-white p-6 shadow-soft">
        <p className="font-semibold text-ink">Sign in before posting a recommendation.</p>
        <Link className="mt-3 inline-flex rounded-md bg-ink px-4 py-2 font-semibold text-white" href="/auth">Go to sign in</Link>
      </div>
    </main>
  );

  if (hasProfile === false) return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-6">
        <p className="font-semibold text-ink">Set up your profile before posting.</p>
        <p className="mt-1 text-sm text-ink/70">Your display name and curator type help people trust your recommendations.</p>
        <Link className="mt-3 inline-flex rounded-md bg-ink px-4 py-2 font-semibold text-white" href="/profile">Create profile</Link>
      </div>
    </main>
  );

  if (newDishId) return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-md border border-basil/20 bg-basil/5 p-8 text-center">
        <p className="text-xl font-semibold text-basil">Recommendation posted!</p>
        <p className="mt-2 text-sm text-ink/60">Thanks for helping others decide what to order.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href={`/dishes/${newDishId}`} className="inline-flex rounded-md bg-basil px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
            View your dish →
          </Link>
          <button
            onClick={() => {
              setStep(1);
              setNewDishId(null);
              setDishName(""); setDescription(""); setHighlight(""); setCourseType(""); setPairsWellWith(""); setAvailability("");
              setSelectedTags([]); setUploadImages([]);
              setSelectedRestaurantId(""); setNewRestaurantName(""); setNewRestaurantCity(""); setNewRestaurantCuisine("");
            }}
            className="rounded-md border border-black/15 px-5 py-2 text-sm font-semibold text-ink hover:bg-black/5"
          >
            Post another
          </button>
        </div>
      </div>
    </main>
  );

  // ── Wizard ────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${step >= s ? "bg-basil text-white" : "bg-black/10 text-ink/40"}`}>
                {s}
              </div>
              <span className={`text-sm font-medium ${step === s ? "text-ink" : "text-ink/40"}`}>{STEP_LABELS[s]}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 rounded-full bg-black/10">
          <div className="h-1.5 rounded-full bg-basil transition-all" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-md border border-black/10 bg-white p-6 shadow-soft">
        <h2 className="mb-5 text-xl font-bold text-ink">{STEP_LABELS[step]}</h2>

        {/* ── Step 1: Dish details ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid gap-4">
            <input className="rounded-md border border-black/15 px-3 py-2" placeholder="Dish name *" value={dishName} onChange={(e) => setDishName(e.target.value)} />
            <textarea className="min-h-28 rounded-md border border-black/15 px-3 py-2" placeholder="Taste notes: texture, spice, portion, why you recommend it" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div>
              <input
                className="w-full rounded-md border border-black/15 px-3 py-2"
                placeholder="What makes this dish special here? (optional)"
                maxLength={200}
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
              />
              <p className="mt-1 text-xs text-ink/40">e.g. "House-made XO sauce, only available at this branch"</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">
                Course type
                <select className="rounded-md border border-black/15 px-3 py-2 font-normal" value={courseType} onChange={(e) => setCourseType(e.target.value)}>
                  <option value="">Not specified</option>
                  {courseTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Availability
                <select className="rounded-md border border-black/15 px-3 py-2 font-normal" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option value="">Not specified</option>
                  {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">
                Pairs well with
                <input className="rounded-md border border-black/15 px-3 py-2 font-normal" placeholder="e.g. garlic naan, mango lassi" value={pairsWellWith} onChange={(e) => setPairsWellWith(e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Price ($)
                <input type="number" min="0" step="0.01" className="rounded-md border border-black/15 px-3 py-2 font-normal" value={priceEstimate} onChange={(e) => setPriceEstimate(e.target.value)} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">
                Rating (1–5)
                <input type="number" min="1" max="5" className="rounded-md border border-black/15 px-3 py-2 font-normal" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Spice level (0–5)
                <input type="number" min="0" max="5" className="rounded-md border border-black/15 px-3 py-2 font-normal" value={spiceLevel} onChange={(e) => setSpiceLevel(Number(e.target.value))} />
              </label>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isVegetarian} onChange={(e) => setIsVegetarian(e.target.checked)} />Vegetarian
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isPersonallyTasted} onChange={(e) => setIsPersonallyTasted(e.target.checked)} />Personally tasted
              </label>
            </div>
          </div>
        )}

        {/* ── Step 2: Restaurant ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="grid gap-4">
            <select
              className="rounded-md border border-black/15 px-3 py-2"
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
            >
              <option value="">+ Add a new restaurant</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.city ? ` – ${r.city}` : ""}</option>
              ))}
            </select>
            {!selectedRestaurantId && (
              <div className="grid gap-3 rounded-md border border-black/10 bg-rice/50 p-4">
                <input className="rounded-md border border-black/15 px-3 py-2" placeholder="Restaurant name *" value={newRestaurantName} onChange={(e) => setNewRestaurantName(e.target.value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="rounded-md border border-black/15 px-3 py-2" placeholder="City" value={newRestaurantCity} onChange={(e) => setNewRestaurantCity(e.target.value)} />
                  <input className="rounded-md border border-black/15 px-3 py-2" placeholder="Cuisine (e.g. Sichuan)" value={newRestaurantCuisine} onChange={(e) => setNewRestaurantCuisine(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Photos + tags ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="grid gap-6">
            <ImageUploader images={uploadImages} onChange={setUploadImages} />
            <div>
              <p className="mb-3 text-sm font-semibold text-ink">Tags <span className="font-normal text-ink/50">(optional)</span></p>
              {tagGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => (
                      <button type="button" key={tag} onClick={() => toggleTag(tag)}
                        className={`rounded-md px-3 py-1.5 text-sm font-semibold ${selectedTags.includes(tag) ? "bg-basil text-white" : "bg-black/5 text-ink"}`}>
                        {tag.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="inline-flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink">
              <ChevronLeft size={16} />Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 ? !step1Valid() : !step2Valid()}
              className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next<ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={saving || !step3Valid()}
              className="inline-flex items-center gap-2 rounded-md bg-tomato px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Send size={16} />{saving ? "Posting..." : "Post recommendation"}
            </button>
          )}
        </div>

        {message && <p className="mt-3 text-sm text-tomato">{message}</p>}
      </div>
    </main>
  );
}
