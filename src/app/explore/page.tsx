"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Compass } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { SetupNotice } from "@/components/SetupNotice";
import type { DishFeedItem } from "@/lib/types";

type FilterKind = "cuisine" | "tag";
type ActiveFilter = { kind: FilterKind; value: string } | null;

export default function ExplorePage() {
  const [dishes, setDishes] = useState<DishFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("dish_feed")
        .select("*")
        .order("like_count", { ascending: false })
        .limit(300);
      if (error) { setLoadError("Could not load dishes. Please refresh."); setLoading(false); return; }
      setDishes(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const cuisineData = useMemo(() => {
    const map = new Map<string, { count: number; hero: string | null }>();
    for (const d of dishes) {
      if (!d.cuisine) continue;
      const existing = map.get(d.cuisine);
      if (!existing) {
        map.set(d.cuisine, { count: 1, hero: d.image_url });
      } else {
        existing.count++;
        if (!existing.hero && d.image_url) existing.hero = d.image_url;
      }
    }
    return Array.from(map.entries())
      .map(([cuisine, v]) => ({ cuisine, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [dishes]);

  const tagData = useMemo(() => {
    const map = new Map<string, { count: number; hero: string | null }>();
    for (const d of dishes) {
      for (const tag of d.tags ?? []) {
        const existing = map.get(tag);
        if (!existing) {
          map.set(tag, { count: 1, hero: d.image_url });
        } else {
          existing.count++;
          if (!existing.hero && d.image_url) existing.hero = d.image_url;
        }
      }
    }
    return Array.from(map.entries())
      .map(([tag, v]) => ({ tag, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (!activeFilter) return [];
    if (activeFilter.kind === "cuisine") {
      return dishes.filter((d) => d.cuisine === activeFilter.value);
    }
    return dishes.filter((d) => d.tags?.includes(activeFilter.value));
  }, [dishes, activeFilter]);

  if (!isSupabaseConfigured) return <main className="mx-auto max-w-6xl px-4 py-10"><SetupNotice /></main>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">

      {/* ── Filtered view ── */}
      {activeFilter ? (
        <>
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink"
          >
            <ChevronLeft size={16} />Back to explore
          </button>

          <div className="mt-4 flex items-baseline gap-3">
            <h1 className="text-3xl font-bold text-ink capitalize">
              {activeFilter.value.replace(/_/g, " ")}
            </h1>
            <span className="text-sm text-ink/50">
              {filteredDishes.length} {filteredDishes.length === 1 ? "dish" : "dishes"}
            </span>
          </div>

          {filteredDishes.length === 0 ? (
            <p className="mt-8 text-ink/50">No dishes found.</p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDishes.map((d) => <DishCard dish={d} key={d.id} />)}
            </div>
          )}
        </>
      ) : (
        /* ── Exploration grid ── */
        <>
          <div className="flex items-center gap-3">
            <Compass size={24} className="text-basil" />
            <h1 className="text-3xl font-bold text-ink">Explore</h1>
          </div>
          <p className="mt-2 text-ink/60">Browse dishes by cuisine or taste.</p>

          {loading ? (
            <p className="mt-8 text-ink/60">Loading...</p>
          ) : loadError ? (
            <p className="mt-8 rounded-md bg-tomato/10 px-4 py-3 text-sm text-tomato">{loadError}</p>
          ) : (
            <>
              {/* Cuisines */}
              {cuisineData.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-xl font-bold text-ink">Browse by cuisine</h2>
                  <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {cuisineData.map(({ cuisine, count, hero }) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => setActiveFilter({ kind: "cuisine", value: cuisine })}
                        className="group overflow-hidden rounded-md border border-black/10 bg-white shadow-soft hover:shadow-md transition-shadow text-left"
                      >
                        <div className="relative aspect-[4/3] bg-black/5">
                          {hero ? (
                            <Image src={hero} alt={cuisine} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
                          ) : (
                            <div className="grid h-full place-items-center text-2xl">🍽️</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-ink">{cuisine}</p>
                          <p className="text-xs text-ink/50">{count} {count === 1 ? "dish" : "dishes"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Tags */}
              {tagData.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-xl font-bold text-ink">Browse by taste</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tagData.map(({ tag, count }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setActiveFilter({ kind: "tag", value: tag })}
                        className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-medium text-ink/70 hover:border-basil hover:text-basil transition-colors"
                      >
                        {tag.replace(/_/g, " ")}
                        <span className="ml-1.5 text-xs text-ink/40">{count}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {cuisineData.length === 0 && tagData.length === 0 && (
                <div className="mt-12 text-center">
                  <p className="text-lg font-semibold text-ink">No dishes to explore yet.</p>
                  <Link href="/recommendations/new" className="mt-4 inline-flex rounded-md bg-basil px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                    Post the first dish
                  </Link>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
