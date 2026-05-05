"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, ChevronLeft, DollarSign, Flag, Flame, Layers, Link2, MapPin, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LikeSaveButtons } from "@/components/LikeSaveButtons";
import { ReportModal } from "@/components/ReportModal";

type DishImage = { url: string; position: number };

type DishDetail = {
  id: string;
  dish_name: string;
  description: string | null;
  rating: number | null;
  price_estimate: number | null;
  is_personally_tasted: boolean | null;
  is_vegetarian: boolean | null;
  spice_level: number | null;
  image_url: string | null;
  course_type: string | null;
  pairs_well_with: string | null;
  created_at: string;
  restaurant_id: string;
  curator_id: string;
  restaurant: { id: string; name: string; city: string | null; state: string | null; cuisine: string | null; address: string | null };
  curator: { id: string; display_name: string; curator_type: string | null; city: string | null };
  tags: string[];
  images: DishImage[];
  like_count: number;
  save_count: number;
};

export default function DishDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dish, setDish] = useState<DishDetail | null>(null);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const [dishRes, countsRes, imagesRes] = await Promise.all([
        supabase
          .from("dish_recommendations")
          .select(`
            id, dish_name, description, rating, price_estimate,
            is_personally_tasted, is_vegetarian, spice_level, image_url, created_at,
            course_type, pairs_well_with,
            restaurant_id, curator_id,
            restaurant:restaurants(id, name, city, state, cuisine, address),
            curator:profiles(id, display_name, curator_type, city),
            dish_recommendation_tags(taste_tags(name))
          `)
          .eq("id", id)
          .single(),
        supabase.from("dish_feed").select("like_count, save_count").eq("id", id).single(),
        supabase.from("dish_images").select("url, position").eq("dish_recommendation_id", id).order("position"),
      ]);

      if (dishRes.error) {
        console.error("[dish detail] query error:", dishRes.error);
        // PGRST116 = no rows returned (.single() found nothing) — genuine 404
        if (dishRes.error.code === "PGRST116") {
          setNotFound(true);
        } else {
          setLoadError(dishRes.error.message ?? "Could not load dish details.");
        }
        setLoading(false);
        return;
      }
      if (!dishRes.data) { setNotFound(true); setLoading(false); return; }

      const tags = (dishRes.data.dish_recommendation_tags as any[])
        .map((row) => row.taste_tags?.name).filter(Boolean) as string[];

      const images: DishImage[] = (imagesRes.data ?? []).length > 0
        ? (imagesRes.data as DishImage[])
        : dishRes.data.image_url ? [{ url: dishRes.data.image_url, position: 0 }] : [];

      const built: DishDetail = {
        ...dishRes.data,
        restaurant: dishRes.data.restaurant as any,
        curator: dishRes.data.curator as any,
        tags,
        images,
        like_count: countsRes.data?.like_count ?? 0,
        save_count: countsRes.data?.save_count ?? 0,
      };
      setDish(built);
      setActiveImageUrl(images[0]?.url ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-10"><p className="text-ink/60">Loading dish...</p></main>;

  if (loadError) return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="font-semibold text-ink">Something went wrong loading this dish.</p>
      <p className="mt-1 rounded-md bg-black/5 px-3 py-2 font-mono text-sm text-ink/60">{loadError}</p>
      <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-basil hover:underline"><ChevronLeft size={16} />Back to feed</Link>
    </main>
  );

  if (notFound || !dish) return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-ink/60">Dish not found.</p>
      <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-basil hover:underline"><ChevronLeft size={16} />Back to feed</Link>
    </main>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink">
        <ChevronLeft size={16} />Back to feed
      </Link>

      <div className="mt-6 overflow-hidden rounded-md border border-black/10 bg-white shadow-soft">

        {/* Hero image */}
        {activeImageUrl ? (
          <div className="relative aspect-[16/7] w-full bg-black/5">
            <Image src={activeImageUrl} alt={dish.dish_name} fill className="object-cover" sizes="768px" priority />
          </div>
        ) : (
          <div className="flex aspect-[16/7] items-center justify-center bg-black/5 text-sm text-ink/40">No photo yet</div>
        )}

        {/* Thumbnail strip (only when >1 image) */}
        {dish.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto bg-black/[0.02] px-4 py-3">
            {dish.images.map((img) => (
              <button
                key={img.position}
                type="button"
                onClick={() => setActiveImageUrl(img.url)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${activeImageUrl === img.url ? "border-basil" : "border-transparent hover:border-black/20"}`}
              >
                <Image src={img.url} alt={`Photo ${img.position + 1}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-ink">{dish.dish_name}</h1>
            {dish.rating !== null && (
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-saffron/15 px-3 py-1.5 text-lg font-semibold text-ink">
                <Star size={18} className="fill-saffron text-saffron" />
                {dish.rating}
              </span>
            )}
          </div>

          <Link href={`/restaurants/${dish.restaurant_id}`} className="mt-2 block text-lg font-semibold text-basil hover:underline">
            {dish.restaurant.name}
          </Link>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink/60">
            <MapPin size={14} />
            {[dish.restaurant.address, dish.restaurant.city, dish.restaurant.state].filter(Boolean).join(", ") || "Location not set"}
            {dish.restaurant.cuisine ? ` • ${dish.restaurant.cuisine}` : ""}
          </p>

          {dish.description && <p className="mt-5 text-base leading-7 text-ink/80">{dish.description}</p>}

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {dish.price_estimate !== null && (
              <div className="rounded-md border border-black/10 p-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink/50"><DollarSign size={13} />Price estimate</p>
                <p className="mt-1 text-lg font-bold text-ink">${dish.price_estimate}</p>
              </div>
            )}
            {dish.spice_level !== null && (
              <div className="rounded-md border border-black/10 p-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink/50"><Flame size={13} />Spice level</p>
                <p className="mt-1 text-lg font-bold text-ink">{dish.spice_level} / 5</p>
              </div>
            )}
            {dish.course_type && (
              <div className="rounded-md border border-black/10 p-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink/50"><Layers size={13} />Course</p>
                <p className="mt-1 text-lg font-bold text-ink capitalize">{dish.course_type.replace(/_/g, " ")}</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {dish.is_personally_tasted && (
              <span className="inline-flex items-center gap-1 rounded-md bg-basil/10 px-3 py-1.5 text-sm font-semibold text-basil">
                <BadgeCheck size={15} />Personally tasted
              </span>
            )}
            {dish.is_vegetarian && (
              <span className="rounded-md bg-basil/10 px-3 py-1.5 text-sm font-semibold text-basil">Vegetarian</span>
            )}
            {dish.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-black/5 px-3 py-1.5 text-sm font-medium text-ink/70">
                {tag.replace(/_/g, " ")}
              </span>
            ))}
          </div>

          {dish.pairs_well_with && (
            <div className="mt-5 flex items-start gap-2 rounded-md border border-black/10 bg-saffron/5 px-4 py-3">
              <Link2 size={15} className="mt-0.5 shrink-0 text-saffron" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Pairs well with</p>
                <p className="mt-0.5 text-sm text-ink/80">{dish.pairs_well_with}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <LikeSaveButtons dishId={dish.id} initialLikes={dish.like_count} initialSaves={dish.save_count} />
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-6">
            <Link href={`/curators/${dish.curator_id}`} className="flex items-center gap-3 hover:opacity-80">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-basil/10">
                <span className="text-sm font-bold text-basil">{dish.curator.display_name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{dish.curator.display_name}</p>
                <p className="text-xs text-ink/50">
                  {dish.curator.curator_type?.replace(/_/g, " ") ?? "Curator"}
                  {dish.curator.city ? ` · ${dish.curator.city}` : ""}
                </p>
              </div>
            </Link>
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-ink/40 hover:bg-black/5 hover:text-tomato"
            >
              <Flag size={13} />Report
            </button>
          </div>
        </div>
      </div>

      {showReport && <ReportModal dishId={dish.id} onClose={() => setShowReport(false)} />}
    </main>
  );
}
