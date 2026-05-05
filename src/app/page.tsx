"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Map, Search, SlidersHorizontal, X } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { SetupNotice } from "@/components/SetupNotice";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DishFeedItem } from "@/lib/types";

const PAGE_SIZE = 20;
type FeedTab = "latest" | "trending" | "following";

export default function HomePage() {
  const [tab, setTab] = useState<FeedTab>("latest");
  const [dishes, setDishes] = useState<DishFeedItem[]>([]);
  const [search, setSearch] = useState("");
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxSpice, setMaxSpice] = useState("");
  const [chipSpicy, setChipSpicy] = useState(false);
  const [chipVegan, setChipVegan] = useState(false);
  const [chipUnder20, setChipUnder20] = useState(false);
  const [chipRating4Plus, setChipRating4Plus] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPostCount, setUserPostCount] = useState<number | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load auth state + following list once
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || !supabase) return;
      setUserId(user.id);

      const [postRes, followRes] = await Promise.all([
        supabase.from("dish_recommendations").select("id", { count: "exact", head: true }).eq("curator_id", user.id),
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
      ]);
      setUserPostCount(postRes.count ?? 0);
      setFollowingIds((followRes.data ?? []).map((r) => r.following_id));
    });
  }, []);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (!supabase) { setLoading(false); return; }

    if (reset) {
      setLoading(true);
      setCursor(null);
      setDishes([]);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    const currentCursor = reset ? null : cursor;

    let query = supabase.from("dish_feed").select("*");

    if (tab === "trending") {
      // Trending loads top 50 all at once — cursor pagination doesn't work with
      // a sort key (like_count) that differs from the cursor key (created_at).
      const { data, error } = await query
        .order("like_count", { ascending: false })
        .order("save_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) { setDishes(data); setHasMore(false); }
      setLoading(false);
      setLoadingMore(false);
      return;
    } else if (tab === "following") {
      if (followingIds.length === 0) {
        setDishes([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      query = query.in("curator_id", followingIds).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    if (currentCursor) {
      query = query.lt("created_at", currentCursor);
    }

    query = query.limit(PAGE_SIZE);

    const { data, error } = await query;
    if (!error && data) {
      const newDishes = reset ? data : [...dishes, ...data];
      setDishes(newDishes);
      setHasMore(data.length === PAGE_SIZE);
      if (data.length > 0) setCursor(data[data.length - 1].created_at);
    }
    setLoading(false);
    setLoadingMore(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, followingIds, cursor]);

  // Re-fetch when tab changes
  useEffect(() => {
    fetchPage(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, followingIds]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchPage(false); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchPage]);

  const cuisines = useMemo(() => {
    const set = new Set(dishes.map((d) => d.cuisine).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [dishes]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    const dishNames = new Set<string>();
    const matchCuisines = new Set<string>();
    const matchTags = new Set<string>();
    for (const d of dishes) {
      if (d.dish_name.toLowerCase().includes(q)) dishNames.add(d.dish_name);
      if (d.cuisine?.toLowerCase().includes(q)) matchCuisines.add(d.cuisine);
      for (const tag of d.tags ?? []) {
        if (tag.toLowerCase().includes(q)) matchTags.add(tag);
      }
    }
    return [
      ...Array.from(dishNames).slice(0, 3).map((v) => ({ type: "dish" as const, value: v, display: v })),
      ...Array.from(matchCuisines).slice(0, 2).map((v) => ({ type: "cuisine" as const, value: v, display: v })),
      ...Array.from(matchTags).slice(0, 3).map((v) => ({ type: "tag" as const, value: v, display: v.replace(/_/g, " ") })),
    ].slice(0, 8);
  }, [search, dishes]);

  const activeFilterCount = [
    selectedCuisine, maxPrice, maxSpice,
    vegetarianOnly ? "veg" : "",
    chipSpicy ? "spicy" : "",
    chipVegan ? "vegan" : "",
    chipUnder20 ? "under20" : "",
    chipRating4Plus ? "rating4" : "",
  ].filter(Boolean).length;

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const query = search.trim().toLowerCase();
      if (query && !(
        dish.dish_name.toLowerCase().includes(query) ||
        dish.restaurant_name?.toLowerCase().includes(query) ||
        dish.cuisine?.toLowerCase().includes(query) ||
        dish.tags?.some((tag) => tag.toLowerCase().includes(query))
      )) return false;
      if (vegetarianOnly && !dish.is_vegetarian) return false;
      if (selectedCuisine && dish.cuisine !== selectedCuisine) return false;
      if (maxPrice && dish.price_estimate !== null && dish.price_estimate > Number(maxPrice)) return false;
      if (maxSpice && dish.spice_level !== null && dish.spice_level > Number(maxSpice)) return false;
      if (chipSpicy && !((dish.spice_level !== null && dish.spice_level >= 3) || dish.tags?.includes("spicy"))) return false;
      if (chipVegan && !dish.tags?.includes("vegan")) return false;
      if (chipUnder20 && dish.price_estimate !== null && dish.price_estimate > 20) return false;
      if (chipRating4Plus && (dish.rating === null || dish.rating < 4)) return false;
      return true;
    });
  }, [dishes, search, vegetarianOnly, selectedCuisine, maxPrice, maxSpice, chipSpicy, chipVegan, chipUnder20, chipRating4Plus]);

  function clearFilters() {
    setVegetarianOnly(false);
    setSelectedCuisine("");
    setMaxPrice("");
    setMaxSpice("");
    setChipSpicy(false);
    setChipVegan(false);
    setChipUnder20(false);
    setChipRating4Plus(false);
  }

  const showNewCuratorNudge = userId !== null && userPostCount === 0;

  return (
    <main>
      <WelcomeBanner />

      <section className="border-b border-black/10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-basil">Dish-level discovery</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold text-ink md:text-5xl">Know exactly what to order.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
              Browse specific dishes recommended by people who actually tasted them, with notes that help you choose fast.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-black/5"
              >
                <Map size={15} />
                Explore on map
              </Link>
            </div>
          </div>
          <div className="rounded-md border border-black/10 bg-white p-3 shadow-soft">
            <div className="relative">
              <label className="flex items-center gap-2 rounded-md border border-black/10 bg-rice px-3 py-2">
                <Search size={18} className="text-ink/50" />
                <input
                  className="w-full bg-transparent outline-none"
                  placeholder="Search dishes, cuisines, tags"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </label>
              {searchFocused && suggestions.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-black/10 bg-white shadow-soft"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSearch(s.display); setSearchFocused(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 text-left"
                    >
                      <span className="text-xs text-ink/35 w-12 shrink-0 capitalize">{s.type}</span>
                      <span className="text-ink/80 capitalize">{s.display}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="mt-3 flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium hover:bg-black/5"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-basil px-2 py-0.5 text-xs font-semibold text-white">{activeFilterCount}</span>
                )}
              </span>
              <span className="text-xs text-ink/40">{showFilters ? "Hide" : "Show"}</span>
            </button>

            {showFilters && (
              <div className="mt-3 grid gap-3 border-t border-black/10 pt-3">
                <label className="flex items-center justify-between text-sm font-medium">
                  Vegetarian only
                  <input type="checkbox" checked={vegetarianOnly} onChange={(e) => setVegetarianOnly(e.target.checked)} />
                </label>
                {cuisines.length > 0 && (
                  <label className="grid gap-1 text-sm font-medium">
                    Cuisine
                    <select
                      className="rounded-md border border-black/10 bg-rice px-2 py-1.5 text-sm"
                      value={selectedCuisine}
                      onChange={(e) => setSelectedCuisine(e.target.value)}
                    >
                      <option value="">All cuisines</option>
                      {cuisines.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                )}
                <label className="grid gap-1 text-sm font-medium">
                  Max price ($)
                  <input
                    type="number" min="0" placeholder="Any"
                    className="rounded-md border border-black/10 bg-rice px-2 py-1.5 text-sm"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Max spice level (0–5)
                  <input
                    type="number" min="0" max="5" placeholder="Any"
                    className="rounded-md border border-black/10 bg-rice px-2 py-1.5 text-sm"
                    value={maxSpice}
                    onChange={(e) => setMaxSpice(e.target.value)}
                  />
                </label>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-sm font-medium text-tomato hover:underline">
                    <X size={14} />Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        {!isSupabaseConfigured ? <SetupNotice /> : null}

        {/* New curator nudge */}
        {showNewCuratorNudge && (
          <div className="mb-6 flex items-center justify-between rounded-md border border-basil/30 bg-basil/5 px-5 py-4">
            <div>
              <p className="font-semibold text-ink">You&apos;re all set! Post your first dish recommendation.</p>
              <p className="mt-0.5 text-sm text-ink/60">Share a dish you&apos;ve personally tasted and help others decide what to order.</p>
            </div>
            <Link
              href="/recommendations/new"
              className="ml-4 shrink-0 rounded-md bg-basil px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Post a dish
            </Link>
          </div>
        )}

        {/* Feed tabs */}
        <div className="mb-4 flex gap-1 rounded-md border border-black/10 bg-white p-1 shadow-soft w-fit">
          {(["latest", "trending", "following"] as FeedTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Quick-tap filter chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { key: "spicy",    label: "🌶️ Spicy",    active: chipSpicy,      toggle: () => setChipSpicy((v) => !v) },
            { key: "vegan",    label: "🌿 Vegan",    active: chipVegan,      toggle: () => setChipVegan((v) => !v) },
            { key: "under20",  label: "Under $20",   active: chipUnder20,    toggle: () => setChipUnder20((v) => !v) },
            { key: "rating4",  label: "⭐ 4+",        active: chipRating4Plus, toggle: () => setChipRating4Plus((v) => !v) },
          ] as const).map(({ key, label, active, toggle }) => (
            <button
              key={key}
              type="button"
              onClick={toggle}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-basil text-white"
                  : "border border-black/15 bg-white text-ink/65 hover:border-basil/50 hover:text-basil"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? <p className="mt-6 text-ink/60">Loading recommendations...</p> : null}

        {/* Following tab empty state */}
        {!loading && tab === "following" && followingIds.length === 0 && (
          <div className="mt-6 rounded-md border border-dashed border-black/20 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-ink">Follow curators to see their dishes here.</p>
            <p className="mt-2 text-ink/60">Visit a curator&apos;s profile and tap Follow to build your feed.</p>
            <button onClick={() => setTab("latest")} className="mt-4 inline-flex rounded-md bg-basil px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Browse all dishes
            </button>
          </div>
        )}

        {!loading && filteredDishes.length === 0 && !(tab === "following" && followingIds.length === 0) ? (
          <div className="mt-6 rounded-md border border-dashed border-black/20 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-ink">
              {activeFilterCount > 0 || search ? "No dishes match your filters." : "No dish recommendations yet."}
            </p>
            <p className="mt-2 text-ink/60">
              {activeFilterCount > 0 || search
                ? "Try adjusting your search or filters."
                : "Create the first trusted recommendation and it will show here."}
            </p>
            {(activeFilterCount > 0 || search) && (
              <button onClick={() => { clearFilters(); setSearch(""); }} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-basil hover:underline">
                <X size={14} />Clear all
              </button>
            )}
          </div>
        ) : null}

        {!loading && filteredDishes.length > 0 && (
          <p className="mb-4 text-sm text-ink/50">
            {filteredDishes.length} {filteredDishes.length === 1 ? "dish" : "dishes"}
            {activeFilterCount > 0 || search ? " matching your filters" : ""}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDishes.map((dish) => (
            <DishCard dish={dish} key={dish.id} />
          ))}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="mt-8 flex justify-center">
          {loadingMore && <p className="text-sm text-ink/50">Loading more...</p>}
          {!hasMore && dishes.length > 0 && (
            <p className="text-sm text-ink/40">You&apos;ve seen all dishes in this feed.</p>
          )}
        </div>
      </section>
    </main>
  );
}
