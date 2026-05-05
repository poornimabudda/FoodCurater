"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Star, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { MapBounds, MapRestaurant } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-md bg-black/5" />,
});

type RestaurantWithDishes = MapRestaurant & {
  cuisine: string | null;
  address: string | null;
  dishes: { id: string; dish_name: string; rating: number | null; image_url: string | null }[];
};

async function geocodeCity(query: string): Promise<{ lat: number; lng: number } | null> {
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
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocodingCount, setGeocodingCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }

      const { data: restRows } = await supabase
        .from("restaurants")
        .select("id, name, address, city, cuisine, lat, lng")
        .order("name");

      const { data: dishRows } = await supabase
        .from("dish_feed")
        .select("id, dish_name, rating, image_url, restaurant_id")
        .order("like_count", { ascending: false });

      const dishMap: Record<string, { id: string; dish_name: string; rating: number | null; image_url: string | null }[]> = {};
      for (const dish of dishRows ?? []) {
        if (!dish.restaurant_id) continue;
        dishMap[dish.restaurant_id] = [...(dishMap[dish.restaurant_id] ?? []), dish];
      }

      const withDishes = (restRows ?? []).filter((r) => (dishMap[r.id]?.length ?? 0) > 0);

      const ready: RestaurantWithDishes[] = [];
      const needsGeocode: typeof withDishes = [];

      for (const r of withDishes) {
        if (r.lat != null && r.lng != null) {
          const dishes = dishMap[r.id] ?? [];
          ready.push({
            id: r.id, name: r.name, lat: r.lat, lng: r.lng,
            dishCount: dishes.length, topDish: dishes[0]?.dish_name ?? null,
            cuisine: r.cuisine, address: r.address, dishes: dishes.slice(0, 5),
          });
        } else if (r.address || r.city) {
          needsGeocode.push(r);
        }
      }

      setRestaurants(ready);
      setLoading(false);

      if (needsGeocode.length === 0) return;
      setGeocodingCount(needsGeocode.length);

      for (const r of needsGeocode) {
        const query = [r.address, r.city].filter(Boolean).join(", ");
        const coords = await geocodeCity(query);
        if (coords && supabase) {
          await supabase.from("restaurants").update({ lat: coords.lat, lng: coords.lng }).eq("id", r.id);
          const dishes = dishMap[r.id] ?? [];
          setRestaurants((prev) => [...prev, {
            id: r.id, name: r.name, lat: coords.lat, lng: coords.lng,
            dishCount: dishes.length, topDish: dishes[0]?.dish_name ?? null,
            cuisine: r.cuisine, address: r.address, dishes: dishes.slice(0, 5),
          }]);
        }
        setGeocodingCount((n) => n - 1);
        await new Promise((res) => setTimeout(res, 1100));
      }
    }
    load();
  }, []);

  function handleMarkerClick(r: MapRestaurant) {
    setSelected(restaurants.find((x) => x.id === r.id) ?? null);
  }

  // Restaurants whose markers are within the current map viewport
  const areaRestaurants = bounds
    ? restaurants.filter(
        (r) =>
          r.lat >= bounds.sw.lat && r.lat <= bounds.ne.lat &&
          r.lng >= bounds.sw.lng && r.lng <= bounds.ne.lng
      )
    : restaurants;

  // Flatten to dishes sorted by rating desc for the sidebar
  const areaDishes = areaRestaurants.flatMap((r) =>
    r.dishes.map((d) => ({ ...d, restaurantName: r.name, restaurantId: r.id }))
  ).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 20);

  return (
    <main className="flex h-[calc(100vh-65px)] flex-col">
      <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-basil" />
          <h1 className="text-lg font-bold text-ink">Explore on map</h1>
          {geocodingCount > 0 && (
            <span className="text-xs text-ink/50">
              (locating {geocodingCount} restaurant{geocodingCount !== 1 ? "s" : ""}…)
            </span>
          )}
        </div>
        <Link href="/" className="text-sm font-medium text-ink/60 hover:text-ink">← Back to feed</Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-3">
          {loading ? (
            <div className="h-full rounded-md bg-black/5 animate-pulse" />
          ) : restaurants.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-black/20 bg-white">
              <div className="text-center">
                <MapPin size={32} className="mx-auto text-ink/20 mb-3" />
                <p className="text-ink/60">No restaurants on the map yet.</p>
                <p className="mt-1 text-sm text-ink/40">Add city info when posting a dish to appear here.</p>
              </div>
            </div>
          ) : (
            <MapView restaurants={restaurants} onMarkerClick={handleMarkerClick} onBoundsChange={setBounds} />
          )}
        </div>

        <div className="w-72 shrink-0 overflow-y-auto border-l border-black/10 bg-white">
          {selected ? (
            <div className="p-4">
              <button
                onClick={() => setSelected(null)}
                className="mb-3 text-xs font-medium text-ink/50 hover:text-ink"
              >
                ← All dishes in area
              </button>
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
            <div className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
                Dishes in this area
                {areaRestaurants.length > 0 && (
                  <span className="ml-1 font-normal normal-case text-ink/30">
                    · {areaRestaurants.length} spot{areaRestaurants.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              {areaDishes.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <MapPin size={28} className="mx-auto text-ink/20 mb-3" />
                  <p className="text-sm text-ink/50">No dishes in this area yet.</p>
                  <p className="mt-1 text-xs text-ink/30">Pan the map to explore other neighbourhoods.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {areaDishes.map((d) => (
                    <Link key={d.id} href={`/dishes/${d.id}`}
                      className="rounded-md border border-black/10 p-2.5 hover:bg-black/[0.02]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink truncate">{d.dish_name}</span>
                        {d.rating !== null && (
                          <span className="ml-2 flex shrink-0 items-center gap-0.5 text-xs font-semibold text-ink/60">
                            <Star size={11} className="fill-saffron text-saffron" />{d.rating}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-ink/40 truncate">{d.restaurantName}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
