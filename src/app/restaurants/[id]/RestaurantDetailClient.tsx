"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, ChevronLeft, MapPin, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { supabase } from "@/lib/supabase";
import type { DishFeedItem } from "@/lib/types";

type Restaurant = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  cuisine: string | null;
  is_verified: boolean;
};

export function RestaurantDetailClient({ id }: { id: string }) {
  const params = useParams<{ id: string }>();
  const restaurantId = id ?? params.id;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<DishFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimText, setClaimText] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const [restaurantResult, dishesResult] = await Promise.all([
        supabase.from("restaurants").select("id, name, address, city, state, cuisine, is_verified").eq("id", restaurantId).single(),
        supabase.from("dish_feed").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }),
      ]);

      if (restaurantResult.error || !restaurantResult.data) { setNotFound(true); setLoading(false); return; }
      setRestaurant(restaurantResult.data as Restaurant);
      setDishes(dishesResult.data ?? []);
      setLoading(false);
    }
    load();
  }, [restaurantId]);

  async function submitClaim() {
    if (!supabase || !userId) return;
    setClaimLoading(true);
    const { error } = await supabase.from("restaurant_claim_requests").insert({
      restaurant_id: restaurantId,
      requester_id: userId,
      message: claimText || null,
    });
    setClaimLoading(false);
    if (!error) {
      setClaimSubmitted(true);
      setShowClaimForm(false);
      setClaimMessage("Your claim request has been submitted. We'll be in touch.");
    } else {
      setClaimMessage("Could not submit claim. You may have already submitted one.");
    }
  }

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading restaurant...</p></main>;
  if (notFound || !restaurant) return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-ink/60">Restaurant not found.</p>
      <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-basil hover:underline"><ChevronLeft size={16} />Back to feed</Link>
    </main>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink">
        <ChevronLeft size={16} />Back to feed
      </Link>

      <div className="mt-6 rounded-md border border-black/10 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-basil/10">
            <UtensilsCrossed size={26} className="text-basil" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold text-ink">{restaurant.name}</h1>
              {restaurant.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-md bg-basil/10 px-2 py-1 text-xs font-semibold text-basil">
                  <ShieldCheck size={13} />Verified
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink/60">
              <MapPin size={14} />
              {[restaurant.address, restaurant.city, restaurant.state].filter(Boolean).join(", ") || "Location not set"}
            </p>
            {restaurant.cuisine && (
              <span className="mt-2 inline-block rounded-md bg-black/5 px-2 py-1 text-sm font-medium text-ink/70">
                {restaurant.cuisine}
              </span>
            )}
          </div>

          {/* Claim restaurant */}
          {userId && !restaurant.is_verified && !claimSubmitted && (
            <div className="shrink-0">
              {!showClaimForm ? (
                <button
                  onClick={() => setShowClaimForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-black/5"
                >
                  <BadgeCheck size={13} />Claim restaurant
                </button>
              ) : (
                <div className="min-w-[260px] rounded-md border border-black/10 bg-rice/50 p-3">
                  <p className="text-xs font-semibold text-ink mb-2">Claim this restaurant</p>
                  <textarea
                    rows={2}
                    placeholder="Optional: describe your connection to this restaurant"
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    className="w-full rounded-md border border-black/10 px-2 py-1.5 text-xs"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={submitClaim}
                      disabled={claimLoading}
                      className="rounded-md bg-basil px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {claimLoading ? "Submitting..." : "Submit claim"}
                    </button>
                    <button onClick={() => setShowClaimForm(false)} className="text-xs text-ink/50 hover:underline">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {claimMessage && (
          <p className={`mt-3 text-sm ${claimSubmitted ? "text-basil" : "text-tomato"}`}>{claimMessage}</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-ink">
          Recommended dishes
          <span className="ml-2 text-base font-normal text-ink/50">({dishes.length})</span>
        </h2>

        {dishes.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-black/20 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-ink">No dish recommendations yet.</p>
            <p className="mt-2 text-ink/60">Be the first to recommend a dish from this restaurant.</p>
            <Link href="/recommendations/new" className="mt-4 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
              Add recommendation
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => <DishCard dish={dish} key={dish.id} />)}
          </div>
        )}
      </div>
    </main>
  );
}
