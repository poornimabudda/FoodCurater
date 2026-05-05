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

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const { data: coll } = await supabase
        .from("collections")
        .select("id, name")
        .eq("id", id)
        .single();

      if (!coll) { setNotFound(true); setLoading(false); return; }
      setName(coll.name);

      const { data: items } = await supabase
        .from("collection_items")
        .select("dish_recommendation_id")
        .eq("collection_id", id);

      const dishIds = (items ?? []).map((r) => r.dish_recommendation_id);
      if (dishIds.length > 0) {
        const { data: feedRows } = await supabase.from("dish_feed").select("*").in("id", dishIds);
        setDishes(feedRows ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading...</p></main>;

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
            <h1 className="text-2xl font-bold text-ink">{name}</h1>
            <p className="mt-0.5 text-sm text-ink/50">{dishes.length} {dishes.length === 1 ? "dish" : "dishes"}</p>
          </div>
        </div>
        <ShareButton
          title={`${name} – Dish Curator`}
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
