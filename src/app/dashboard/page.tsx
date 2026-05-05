"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, Bookmark, Eye, Heart, PlusCircle, TrendingUp } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { SetupNotice } from "@/components/SetupNotice";

type DishStat = {
  id: string;
  dish_name: string;
  restaurant_name: string | null;
  like_count: number;
  save_count: number;
  view_count: number;
  created_at: string;
};

type Stats = {
  totalLikes: number;
  totalSaves: number;
  totalViews: number;
  totalDishes: number;
  topDish: DishStat | null;
  streak: number;
  dishes: DishStat[];
};

function computeStreak(dishes: DishStat[]): number {
  if (dishes.length === 0) return 0;
  const weeks = new Set(
    dishes.map((d) => {
      const date = new Date(d.created_at);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      return Math.floor((date.getTime() - startOfYear.getTime()) / (7 * 86400 * 1000));
    })
  );
  const now = new Date();
  const currentWeek = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 86400 * 1000));
  let streak = 0;
  for (let w = currentWeek; w >= 0; w--) {
    if (weeks.has(w)) streak++;
    else break;
  }
  return streak;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: feedRows } = await supabase
        .from("dish_feed")
        .select("id, dish_name, restaurant_name, like_count, save_count, created_at")
        .eq("curator_id", user.id)
        .order("created_at", { ascending: false });

      const dishes = feedRows ?? [];
      const dishIds = dishes.map((d) => d.id);

      let viewMap: Record<string, number> = {};
      if (dishIds.length > 0) {
        const { data: viewRows } = await supabase
          .from("dish_view_counts")
          .select("dish_recommendation_id, view_count")
          .in("dish_recommendation_id", dishIds);
        viewMap = Object.fromEntries((viewRows ?? []).map((r) => [r.dish_recommendation_id, r.view_count]));
      }

      const enriched: DishStat[] = dishes.map((d) => ({
        id: d.id,
        dish_name: d.dish_name,
        restaurant_name: d.restaurant_name,
        like_count: d.like_count ?? 0,
        save_count: d.save_count ?? 0,
        view_count: viewMap[d.id] ?? 0,
        created_at: d.created_at,
      }));

      const totalLikes = enriched.reduce((s, d) => s + d.like_count, 0);
      const totalSaves = enriched.reduce((s, d) => s + d.save_count, 0);
      const totalViews = enriched.reduce((s, d) => s + d.view_count, 0);

      const topDish = enriched.length > 0
        ? [...enriched].sort((a, b) => (b.like_count + b.save_count) - (a.like_count + a.save_count))[0]
        : null;

      setStats({
        totalLikes,
        totalSaves,
        totalViews,
        totalDishes: enriched.length,
        topDish,
        streak: computeStreak(enriched),
        dishes: enriched,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (!isSupabaseConfigured) return <main className="mx-auto max-w-4xl px-4 py-10"><SetupNotice /></main>;
  if (loading) return <main className="mx-auto max-w-4xl px-4 py-10"><p className="text-ink/60">Loading dashboard...</p></main>;

  if (!userId) return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-md border border-black/10 bg-white p-10 text-center shadow-soft">
        <BarChart2 size={32} className="mx-auto text-basil" />
        <p className="mt-4 text-lg font-semibold text-ink">Sign in to see your dashboard</p>
        <Link href="/auth" className="mt-5 inline-flex rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black">Sign in</Link>
      </div>
    </main>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BarChart2 size={24} className="text-basil" />
          <h1 className="text-3xl font-bold text-ink">Your dashboard</h1>
        </div>
        <Link href="/recommendations/new" className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
          <PlusCircle size={15} />Post a dish
        </Link>
      </div>

      {stats && stats.totalDishes === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-black/20 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-ink">No recommendations yet.</p>
          <p className="mt-2 text-sm text-ink/60">Post your first dish to start seeing stats here.</p>
          <Link href="/recommendations/new" className="mt-5 inline-flex rounded-md bg-basil px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
            Post a dish
          </Link>
        </div>
      ) : stats ? (
        <>
          {/* Summary cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Heart size={18} className="text-tomato" />} label="Total likes" value={stats.totalLikes} />
            <StatCard icon={<Bookmark size={18} className="text-basil" />} label="Total saves" value={stats.totalSaves} />
            <StatCard icon={<Eye size={18} className="text-ink/50" />} label="Total views" value={stats.totalViews} />
            <StatCard icon={<TrendingUp size={18} className="text-saffron" />} label="Week streak" value={`${stats.streak}w`} />
          </div>

          {/* Top dish */}
          {stats.topDish && (
            <div className="mt-8 rounded-md border border-black/10 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-3">Top dish by engagement</p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/dishes/${stats.topDish.id}`} className="text-xl font-bold text-ink hover:underline">
                    {stats.topDish.dish_name}
                  </Link>
                  {stats.topDish.restaurant_name && (
                    <p className="mt-1 text-sm text-ink/60">{stats.topDish.restaurant_name}</p>
                  )}
                </div>
                <div className="flex gap-4 shrink-0 text-right">
                  <div>
                    <p className="text-lg font-bold text-ink">{stats.topDish.like_count}</p>
                    <p className="text-xs text-ink/50">likes</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-ink">{stats.topDish.save_count}</p>
                    <p className="text-xs text-ink/50">saves</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-ink">{stats.topDish.view_count}</p>
                    <p className="text-xs text-ink/50">views</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All dishes table */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-ink mb-4">All recommendations</h2>
            <div className="overflow-hidden rounded-md border border-black/10 bg-white shadow-soft">
              <table className="w-full text-sm">
                <thead className="border-b border-black/10 bg-black/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink/50">Dish</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink/50">Likes</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink/50">Saves</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink/50">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {stats.dishes.map((d) => (
                    <tr key={d.id} className="hover:bg-black/[0.01]">
                      <td className="px-4 py-3">
                        <Link href={`/dishes/${d.id}`} className="font-medium text-ink hover:underline">{d.dish_name}</Link>
                        {d.restaurant_name && <p className="text-xs text-ink/50">{d.restaurant_name}</p>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink">{d.like_count}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink">{d.save_count}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink">{d.view_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-medium text-ink/50">
        {icon}{label}
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
