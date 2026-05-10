"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { ShareButton } from "@/components/ShareButton";
import { supabase } from "@/lib/supabase";
import type { DishFeedItem } from "@/lib/types";

interface CollectionPageClientProps {
  id: string;
}

export function CollectionPageClient({ id }: CollectionPageClientProps) {
  const [name, setName] = useState<string | null>(null);
  const [dishes, setDishes] = useState<DishFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const { data: coll, error: collError } = await supabase
        .from("collections")
        .select("id, name")
        .eq("id", id)
        .single();

      if (collError || !coll) {
        if (collError?.code === "PGRST116" || !coll) { setNotFound(true); }
        else setLoadError("Could not load this collection. Please refresh.");
        setLoading(false);
        return;
      }
      setName(coll.name);

      const { data: items, error: itemsError } = await supabase
        .from("collection_items")
        .select("dish_recommendation_id")
        .eq("collection_id", id);

      if (itemsError) { setLoadError("Could not load collection dishes. Please refresh."); setLoading(false); return; }

      const dishIds = (items ?? []).map((r) => r.dish_recommendation_id);
      if (dishIds.length > 0) {
        const { data: feedRows, error: feedError } = await supabase.from("dish_feed").select("*").in("id", dishIds);
        if (feedError) { setLoadError("Could not load dishes. Please refresh."); setLoading(false); return; }
        setDishes(feedRows ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading...</p></main>;

  if (loadError) return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="rounded-md bg-tomato/10 px-4 py-3 text-sm text-tomato">{loadError}</p>
    </main>
  );

  if (notFound) return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-md border border-dashed border-black/20 bg-white p-12 text-center">
        <p className="text-lg font-semibold text-ink">Collection not found.</p>
        <p className="mt-2 text-sm text-ink/50">It may have been deleted or the link is incorrect.</p>
        <Link href="/" className="mt-4 inline-flex rounded-md bg-basil px-5 py-2 text-sm font-semibold text-white hover:opacity-90">Browse dishes</Link>
      </div>
    </main>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-basil/10">
            <FolderOpen size={20} className="text-basil" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">{name ?? "Collection"}</h1>
            <p className="mt-0.5 text-sm text-ink/50">{dishes.length} {dishes.length === 1 ? "dish" : "dishes"}</p>
          </div>
        </div>
        <ShareButton
          title={`${name ?? "Collection"} – Dish Curator`}
          path={`/collections/${id}`}
          label="Share"
          className="flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5"
        />
      </div>

      {dishes.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-black/20 bg-white p-10 text-center">
          <p className="text-ink/60">This collection is empty.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => <DishCard key={dish.id} dish={dish} />)}
        </div>
      )}
    </main>
  );
}
