"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Star, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { MapRestaurant } from "@/components/MapView";

// SSR must be disabled for Leaflet — it accesses window/document on mount
const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-md bg-black/5" />,
});

type RestaurantWithDishes = MapRestaurant & {
  cuisine: string | null;
  address: string | null;
  dishes: { id: string; dish_name: string; rating: number | null; image_url: string | null }[];
};

async function geocode(address: string, city: string | null): Promise<{ lat: number; lng: number } | null> {
  const query = [address, city].filter(Boolean).join(", ");
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "User-Agent": "DishCurator/1.0" } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

export default function MapPage() {
  const [restaurants, setRestaurants] = useState<RestaurantWithDishes[]>([]);
  const [selected, setSelected] = useState<RestaurantWithDishes | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      // Load all restaurants that have at least one dish
      const { data: restRows } = await supabase
        .from("restaurants")
        .select("id, name, address, city, state, cuisine")
        .order("name");

      if (!restRows || restRows.length === 0) { setLoading(false); return; }

      // Load dish summaries per restaurant
      const { data: dishRows } = await supabase
        .from("dish_feed")
        .select("id, dish_name, rating, image_url, restaurant_id")
        .order("like_count", { ascending: false });

      const dishMap: Record<string, { id: string; dish_name: string; rating: number | null; image_url: string | null }[]> = {};
      for (const dish of dishRows ?? []) {
        if (!dish.restaurant_id) continue;
        dishMap[dish.restaurant_id] = [...(dishMap[dish.restaurant_id] ?? []), dish];
      }

      // Only include restaurants that have dishes
      const withDishes = restRows.filter((r) => (dishMap[r.id]?.length ?? 0) > 0);
      setLoading(false);
      setGeocoding(true);

      // Geocode addresses (rate limited: 1 per second per Nominatim TOS)
      const results: RestaurantWithDishes[] = [];
      for (const r of withDishes) {
        if (r.address || r.city) {
          const coords = await geocode(r.address ?? r.city ?? "", r.city);
          if (coords) {
            const dishes = dishMap[r.id] ?? [];
            results.push({
              id: r.id,
              name: r.name,
              lat: coords.lat,
              lng: coords.lng,
              dishCount: dishes.length,
              topDish: dishes[0]?.dish_name ?? null,
              cuisine: r.cuisine,
              address: r.address,
              dishes: dishes.slice(0, 5),
            });
            setRestaurants([...results]);
          }
          // Respect Nominatim 1 req/sec rate limit
          await new Promise((r) => setTimeout(r, 1100));
        }
      }
      setGeocoding(false);
    }
    load();
  }, []);

  function handleMarkerClick(r: MapRestaurant) {
    const full = restaurants.find((x) => x.id === r.id) ?? null;
    setSelected(full);
  }

  return (
    <main className="flex h-[calc(100vh-65px)] flex-col">
      <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-basil" />
          <h1 className="text-lg font-bold text-ink">Explore on map</h1>
          {geocoding && <span className="text-xs text-ink/50">(geocoding restaurants...)</span>}
        </div>
        <Link href="/" className="text-sm font-medium text-ink/60 hover:text-ink">← Back to feed</Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 p-3">
          {loading ? (
            <div className="h-full rounded-md bg-black/5 animate-pulse" />
          ) : restaurants.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-black/20 bg-white">
              <div className="text-center">
                <MapPin size={32} className="mx-auto text-ink/20 mb-3" />
                <p className="text-ink/60">No geocodable restaurants yet.</p>
                <p className="mt-1 text-sm text-ink/40">Restaurants need an address or city to appear on the map.</p>
              </div>
            </div>
          ) : (
            <MapView restaurants={restaurants} onMarkerClick={handleMarkerClick} />
          )}
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 overflow-y-auto border-l border-black/10 bg-white">
          {selected ? (
            <div className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-basil/10">
                  <UtensilsCrossed size={20} className="text-basil" />
                </div>
                <div>
                  <Link href={`/restaurants/${selected.id}`} className="font-bold text-ink hover:underline">{selected.name}</Link>
                  <p className="text-xs text-ink/50 mt-0.5">{[selected.cuisine, selected.address].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-3">
                {selected.dishCount} dish{selected.dishCount !== 1 ? "es" : ""}
              </p>
              <div className="grid gap-2">
                {selected.dishes.map((d) => (
                  <Link key={d.id} href={`/dishes/${d.id}`}
                    className="flex items-center justify-between rounded-md border border-black/10 p-2.5 hover:bg-black/[0.02]">
                    <span className="text-sm font-medium text-ink truncate">{d.dish_name}</span>
                    {d.rating !== null && (
                      <span className="ml-2 flex shrink-0 items-center gap-0.5 text-xs font-semibold text-ink/60">
                        <Star size={11} className="fill-saffron text-saffron" />{d.rating}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              <Link href={`/restaurants/${selected.id}`}
                className="mt-4 block text-center rounded-md border border-black/15 py-2 text-sm font-medium text-ink hover:bg-black/5">
                View all dishes →
              </Link>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <MapPin size={28} className="mx-auto text-ink/20 mb-3" />
                <p className="text-sm text-ink/50">Click a marker to see dishes at that restaurant.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
