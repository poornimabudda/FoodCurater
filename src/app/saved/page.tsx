"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { SetupNotice } from "@/components/SetupNotice";
import type { DishFeedItem } from "@/lib/types";

export default function SavedPage() {
  const [dishes, setDishes] = useState<DishFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (!user) { setLoading(false); return; }

      const { data: savedRows } = await supabase
        .from("saved_dishes")
        .select("dish_recommendation_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const ids = savedRows?.map((r) => r.dish_recommendation_id) ?? [];
      if (ids.length === 0) { setLoading(false); return; }

      const { data: feedData } = await supabase
        .from("dish_feed")
        .select("*")
        .in("id", ids);

      // Restore save order (dish_feed .in() doesn't guarantee order)
      const orderMap = new Map(ids.map((id, i) => [id, i]));
      const sorted = (feedData ?? []).sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      );

      setDishes(sorted);
      setLoading(false);
    }
    load();
  }, []);

  if (!isSupabaseConfigured) return <main className="mx-auto max-w-6xl px-4 py-10"><SetupNotice /></main>;

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading saved dishes...</p></main>;

  if (!userId) return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-md border border-black/10 bg-white p-10 text-center shadow-soft">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-basil/10">
          <Bookmark size={26} className="text-basil" />
        </div>
        <p className="mt-4 text-lg font-semibold text-ink">Sign in to see your saved dishes</p>
        <p className="mt-2 text-sm text-ink/60">Save dishes you want to try and find them here.</p>
        <Link href="/auth" className="mt-5 inline-flex rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black">
          Sign in
        </Link>
      </div>
    </main>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-3">
        <Bookmark size={22} className="text-basil" />
        <h1 className="text-3xl font-bold text-ink">Saved dishes</h1>
      </div>

      {dishes.length === 0 ? (
        <div className="mt-6 rounded-md border border-dashed border-black/20 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-ink">No saved dishes yet.</p>
          <p className="mt-2 text-sm text-ink/60">Browse the feed and tap the bookmark icon on any dish to save it.</p>
          <Link href="/" className="mt-5 inline-flex rounded-md bg-basil px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
            Browse dishes
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink/50">
            {dishes.length} {dishes.length === 1 ? "dish" : "dishes"} saved
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => <DishCard dish={dish} key={dish.id} />)}
          </div>
        </>
      )}
    </main>
  );
}
