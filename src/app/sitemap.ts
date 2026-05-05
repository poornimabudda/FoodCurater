import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

const BASE = "https://food-curator.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [dishRes, restaurantRes, curatorRes] = await Promise.all([
    sb.from("dish_recommendations").select("id, updated_at").order("created_at", { ascending: false }).limit(500),
    sb.from("restaurants").select("id, updated_at").limit(500),
    sb.from("profiles").select("id, updated_at").limit(500),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/map`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  const dishRoutes: MetadataRoute.Sitemap = (dishRes.data ?? []).map((d) => ({
    url: `${BASE}/dishes/${d.id}`,
    lastModified: new Date(d.updated_at),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const restaurantRoutes: MetadataRoute.Sitemap = (restaurantRes.data ?? []).map((r) => ({
    url: `${BASE}/restaurants/${r.id}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const curatorRoutes: MetadataRoute.Sitemap = (curatorRes.data ?? []).map((c) => ({
    url: `${BASE}/curators/${c.id}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...dishRoutes, ...restaurantRoutes, ...curatorRoutes];
}
