"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DishFeedItem } from "@/lib/types";

export default function HomePage() {
  const [dishes, setDishes] = useState<DishFeedItem[]>([]);
  const [search, setSearch] = useState("");
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxSpice, setMaxSpice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      if (!supabase) { setLoading(false); return; }
      const { data, error } = await supabase.from("dish_feed").select("*").order("created_at", { ascending: false });
      if (!error) setDishes(data ?? []);
      setLoading(false);
    }
    loadFeed();
  }, []);

  const cuisines = useMemo(() => {
    const set = new Set(dishes.map((d) => d.cuisine).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [dishes]);

  const activeFilterCount = [selectedCuisine, maxPrice, maxSpice, vegetarianOnly ? "veg" : ""].filter(Boolean).length;

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
      return true;
    });
  }, [dishes, search, vegetarianOnly, selectedCuisine, maxPrice, maxSpice]);

  function clearFilters() {
    setVegetarianOnly(false);
    setSelectedCuisine("");
    setMaxPrice("");
    setMaxSpice("");
  }

  return (
    <main>
      <section className="border-b border-black/10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-basil">Dish-level discovery</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold text-ink md:text-5xl">Know exactly what to order.</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
              Browse specific dishes recommended by people who actually tasted them, with notes that help you choose fast.
            </p>
          </div>
          <div className="rounded-md border border-black/10 bg-white p-3 shadow-soft">
            <label className="flex items-center gap-2 rounded-md border border-black/10 bg-rice px-3 py-2">
              <Search size={18} className="text-ink/50" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Search dishes, cuisines, tags"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
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
        {loading ? <p className="mt-6 text-ink/60">Loading recommendations...</p> : null}
        {!loading && filteredDishes.length === 0 ? (
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
          <p className="mt-2 text-sm text-ink/50">
            {filteredDishes.length} {filteredDishes.length === 1 ? "dish" : "dishes"}
            {activeFilterCount > 0 || search ? " matching your filters" : ""}
          </p>
        )}
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDishes.map((dish) => (
            <DishCard dish={dish} key={dish.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
