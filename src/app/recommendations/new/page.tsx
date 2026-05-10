"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import type { ImagePreview } from "@/components/ImageUploader";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { TasteTagRow } from "@/lib/types";
import { DishDetailsStep, type DishDetailsState } from "./DishDetailsStep";
import { RestaurantStep, type RestaurantState, type Restaurant } from "./RestaurantStep";
import { PhotoTagsStep } from "./PhotoTagsStep";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Tell us about the dish",
  2: "Where did you eat?",
  3: "Photos & tags",
};

export default function NewRecommendationPage() {
  const [step, setStep] = useState<Step>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [message, setMessage] = useState("");
  const [newDishId, setNewDishId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1 state
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

  // Step 2 state
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantAddress, setNewRestaurantAddress] = useState("");
  const [newRestaurantCity, setNewRestaurantCity] = useState("");
  const [newRestaurantCuisine, setNewRestaurantCuisine] = useState("");
  const [newRestaurantLat, setNewRestaurantLat] = useState<number | null>(null);
  const [newRestaurantLng, setNewRestaurantLng] = useState<number | null>(null);

  // Step 3 state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadImages, setUploadImages] = useState<ImagePreview[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!supabase) { setLoading(false); return; }
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setUserId(user?.id ?? null);
      if (user) {
        const [profileRes, restaurantRes] = await Promise.all([
          supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
          supabase.from("restaurants").select("id, name, city, cuisine").order("name"),
        ]);
        setHasProfile(!!profileRes.data?.display_name);
        setRestaurants(restaurantRes.data ?? []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function step1Valid() { return dishName.trim().length > 0; }
  function step2Valid() { return !!selectedRestaurantId || newRestaurantName.trim().length > 0; }
  // Photos are optional — curators can post without images
  function step3Valid() { return !uploadImages.some((img) => img.error); }

  async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "User-Agent": "DishCurator/1.0" } }
      );
      const data = await res.json();
      if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch { /* non-fatal */ }
    return null;
  }

  async function resolveRestaurant(): Promise<string | null> {
    if (!supabase || !userId) return null;
    if (selectedRestaurantId) return selectedRestaurantId;

    let lat = newRestaurantLat;
    let lng = newRestaurantLng;
    if (lat === null || lng === null) {
      const geoQuery = [newRestaurantAddress, newRestaurantCity, newRestaurantName].filter(Boolean).join(", ");
      const coords = geoQuery ? await geocodeAddress(geoQuery) : null;
      lat = coords?.lat ?? null;
      lng = coords?.lng ?? null;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert({ name: newRestaurantName, address: newRestaurantAddress || null, city: newRestaurantCity || null, cuisine: newRestaurantCuisine || null, created_by: userId, lat, lng })
      .select("id").single<{ id: string }>();
    if (error) throw error;
    return data.id;
  }

  async function submit() {
    if (!supabase || !userId) return;
    setSaving(true);
    setMessage("");
    setNewDishId(null);
    try {
      const restaurantId = await resolveRestaurant();
      if (!restaurantId) throw new Error("Choose or add a restaurant.");

      // Generate ID upfront so images are uploaded before the DB row is created.
      // If upload fails, no orphaned recommendation row exists.
      const recommendationId = crypto.randomUUID();

      // Upload images first
      const imageResults: { url: string; position: number }[] = [];
      for (let i = 0; i < uploadImages.length; i++) {
        const img = uploadImages[i];
        const path = `${recommendationId}/${i}_${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("food_images").upload(path, img.file, { upsert: true });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        const { data } = supabase.storage.from("food_images").getPublicUrl(path);
        imageResults.push({ url: data.publicUrl, position: i });
      }

      // Create recommendation row with the pre-generated ID
      const { error: recError } = await supabase
        .from("dish_recommendations")
        .insert({
          id: recommendationId,
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
        });
      if (recError) throw recError;

      if (imageResults.length > 0) {
        await supabase.from("dish_recommendations").update({ image_url: imageResults[0].url }).eq("id", recommendationId);
        await supabase.from("dish_images").insert(
          imageResults.map((r) => ({ dish_recommendation_id: recommendationId, url: r.url, position: r.position }))
        );
      }

      if (selectedTags.length > 0) {
        const { data: tags } = await supabase.from("taste_tags").select("id, name").in("name", selectedTags).returns<Pick<TasteTagRow, "id" | "name">[]>();
        await supabase.from("dish_recommendation_tags").insert(
          (tags ?? []).map((tag) => ({ dish_recommendation_id: recommendationId, taste_tag_id: tag.id }))
        );
      }

      setNewDishId(recommendationId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save recommendation.");
    } finally {
      setSaving(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setNewDishId(null);
    setDishName(""); setDescription(""); setHighlight(""); setCourseType(""); setPairsWellWith(""); setAvailability("");
    setRating(5); setSpiceLevel(0); setIsVegetarian(false); setIsPersonallyTasted(true);
    setSelectedTags([]); setUploadImages([]);
    setSelectedRestaurantId(""); setNewRestaurantName(""); setNewRestaurantAddress(""); setNewRestaurantCity(""); setNewRestaurantCuisine("");
    setNewRestaurantLat(null); setNewRestaurantLng(null);
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isSupabaseConfigured) return <main className="mx-auto max-w-2xl px-4 py-10"><SetupNotice /></main>;
  if (loading) return <main className="mx-auto max-w-2xl px-4 py-10"><p className="text-ink/60">Loading...</p></main>;

  if (!userId) return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-md border border-black/10 bg-white p-6 shadow-soft">
        <p className="font-semibold text-ink">Sign in before posting a recommendation.</p>
        <Link className="mt-3 inline-flex rounded-md bg-ink px-4 py-2 font-semibold text-white" href="/auth?returnTo=/recommendations/new">Go to sign in</Link>
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
          <button onClick={resetWizard} className="rounded-md border border-black/15 px-5 py-2 text-sm font-semibold text-ink hover:bg-black/5">
            Post another
          </button>
        </div>
      </div>
    </main>
  );

  const dishState: DishDetailsState = {
    dishName, description, highlight, rating, priceEstimate,
    isVegetarian, spiceLevel, isPersonallyTasted, courseType, pairsWellWith, availability,
  };

  const restaurantState: RestaurantState = {
    selectedRestaurantId, newRestaurantName, newRestaurantAddress,
    newRestaurantCity, newRestaurantCuisine, newRestaurantLat, newRestaurantLng,
  };

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

        {step === 1 && (
          <DishDetailsStep
            {...dishState}
            setDishName={setDishName}
            setDescription={setDescription}
            setHighlight={setHighlight}
            setRating={setRating}
            setPriceEstimate={setPriceEstimate}
            setIsVegetarian={setIsVegetarian}
            setSpiceLevel={setSpiceLevel}
            setIsPersonallyTasted={setIsPersonallyTasted}
            setCourseType={setCourseType}
            setPairsWellWith={setPairsWellWith}
            setAvailability={setAvailability}
          />
        )}

        {step === 2 && (
          <RestaurantStep
            restaurants={restaurants}
            {...restaurantState}
            setSelectedRestaurantId={setSelectedRestaurantId}
            setNewRestaurantName={setNewRestaurantName}
            setNewRestaurantAddress={setNewRestaurantAddress}
            setNewRestaurantCity={setNewRestaurantCity}
            setNewRestaurantCuisine={setNewRestaurantCuisine}
            setNewRestaurantLat={setNewRestaurantLat}
            setNewRestaurantLng={setNewRestaurantLng}
          />
        )}

        {step === 3 && (
          <PhotoTagsStep
            selectedTags={selectedTags}
            toggleTag={toggleTag}
            uploadImages={uploadImages}
            setUploadImages={setUploadImages}
          />
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
