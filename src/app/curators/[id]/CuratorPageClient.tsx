"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, User } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { FollowButton } from "@/components/FollowButton";
import { supabase } from "@/lib/supabase";
import type { DishFeedItem, ProfileRow } from "@/lib/types";

function computeSpecializations(dishes: DishFeedItem[]) {
  const tagCounts: Record<string, number> = {};
  const cuisineCounts: Record<string, number> = {};
  for (const dish of dishes) {
    for (const tag of dish.tags ?? []) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    if (dish.cuisine) cuisineCounts[dish.cuisine] = (cuisineCounts[dish.cuisine] ?? 0) + 1;
  }
  const topTags = Object.entries(tagCounts).filter(([, c]) => c >= 2).sort(([,a],[,b]) => b-a).slice(0,2).map(([t]) => t);
  const topCuisine = Object.entries(cuisineCounts).filter(([, c]) => c >= 2).sort(([,a],[,b]) => b-a).at(0)?.[0] ?? null;
  return { topTags, topCuisine };
}

function capitalize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CuratorPageClient({ id }: { id: string }) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [dishes, setDishes] = useState<DishFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => setViewerId(user?.id ?? null));
  }, []);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const [profileResult, dishesResult, followerResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("dish_feed").select("*").eq("curator_id", id).order("created_at", { ascending: false }),
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", id),
      ]);

      if (profileResult.error || !profileResult.data) { setNotFound(true); setLoading(false); return; }
      setProfile(profileResult.data);
      setDishes(dishesResult.data ?? []);
      setFollowerCount(followerResult.count ?? 0);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading curator...</p></main>;
  if (notFound || !profile) return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-ink/60">Curator not found.</p>
      <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-basil hover:underline">
        <ChevronLeft size={16} />Back to feed
      </Link>
    </main>
  );

  const { topTags, topCuisine } = computeSpecializations(dishes);
  const hasSpecializations = topTags.length > 0 || topCuisine !== null;
  const isOwnProfile = viewerId === id;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink">
        <ChevronLeft size={16} />Back to feed
      </Link>

      <div className="mt-6 rounded-md border border-black/10 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-basil/10">
            <User size={28} className="text-basil" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-ink">{profile.display_name}</h1>
              {!isOwnProfile && viewerId && (
                <FollowButton
                  curatorId={id}
                  viewerId={viewerId}
                  onFollowChange={(delta) => setFollowerCount((c) => c + delta)}
                />
              )}
            </div>
            <p className="mt-1 text-sm text-ink/60">
              {profile.curator_type?.replace(/_/g, " ") ?? "Curator"}
              {profile.city ? ` · ${profile.city}` : ""}
            </p>
            {profile.bio && <p className="mt-3 text-sm leading-6 text-ink/70">{profile.bio}</p>}

            {hasSpecializations && (
              <div className="mt-4 flex flex-wrap gap-2">
                {topTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-saffron/15 px-3 py-1.5 text-xs font-semibold text-ink">
                    ★ {capitalize(tag)} Expert
                  </span>
                ))}
                {topCuisine && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-saffron/15 px-3 py-1.5 text-xs font-semibold text-ink">
                    ★ {topCuisine} Specialist
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 text-right space-y-2">
            <div>
              <p className="text-2xl font-bold text-ink">{dishes.length}</p>
              <p className="text-xs text-ink/50">{dishes.length === 1 ? "dish" : "dishes"} curated</p>
            </div>
            <div>
              <p className="text-lg font-bold text-ink">{followerCount}</p>
              <p className="text-xs text-ink/50">{followerCount === 1 ? "follower" : "followers"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-ink">Recommendations</h2>
        {dishes.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-black/20 bg-white p-8 text-center">
            <p className="text-ink/60">No recommendations yet.</p>
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
