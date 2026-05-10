"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { RestaurantRow } from "@/lib/types";

export type Restaurant = Pick<RestaurantRow, "id" | "name" | "city" | "cuisine">;

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

export type RestaurantState = {
  selectedRestaurantId: string;
  newRestaurantName: string;
  newRestaurantAddress: string;
  newRestaurantCity: string;
  newRestaurantCuisine: string;
  newRestaurantLat: number | null;
  newRestaurantLng: number | null;
};

type Props = RestaurantState & {
  restaurants: Restaurant[];
  setSelectedRestaurantId: (v: string) => void;
  setNewRestaurantName: (v: string) => void;
  setNewRestaurantAddress: (v: string) => void;
  setNewRestaurantCity: (v: string) => void;
  setNewRestaurantCuisine: (v: string) => void;
  setNewRestaurantLat: (v: number | null) => void;
  setNewRestaurantLng: (v: number | null) => void;
};

export function RestaurantStep({
  restaurants,
  selectedRestaurantId, setSelectedRestaurantId,
  newRestaurantName, setNewRestaurantName,
  newRestaurantAddress, setNewRestaurantAddress,
  newRestaurantCity, setNewRestaurantCity,
  newRestaurantCuisine, setNewRestaurantCuisine,
  newRestaurantLat, setNewRestaurantLat,
  setNewRestaurantLng,
}: Props) {
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [photonResults, setPhotonResults] = useState<PhotonFeature[]>([]);
  const [photonLoading, setPhotonLoading] = useState(false);
  const [photonOpen, setPhotonOpen] = useState(false);
  const photonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = restaurantQuery.trim();
    if (q.length < 2) { setPhotonResults([]); setPhotonOpen(false); return; }
    const timer = setTimeout(async () => {
      setPhotonLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&layer=poi`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setPhotonResults(data.features ?? []);
        setPhotonOpen((data.features ?? []).length > 0);
      } catch {
        setPhotonResults([]);
      } finally {
        setPhotonLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [restaurantQuery]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (photonRef.current && !photonRef.current.contains(e.target as Node)) {
        setPhotonOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectPhotonResult(feat: PhotonFeature) {
    const p = feat.properties;
    const [lng, lat] = feat.geometry.coordinates;
    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    setNewRestaurantName(p.name ?? "");
    setNewRestaurantAddress(street);
    setNewRestaurantCity(p.city ?? p.state ?? "");
    setNewRestaurantLat(lat);
    setNewRestaurantLng(lng);
    setRestaurantQuery(`${p.name ?? ""}${p.city ? ` – ${p.city}` : ""}`);
    setPhotonOpen(false);
  }

  function clearPhotonCoords() {
    setNewRestaurantLat(null);
    setNewRestaurantLng(null);
  }

  return (
    <div className="grid gap-4">
      <select
        className="rounded-md border border-black/15 px-3 py-2"
        value={selectedRestaurantId}
        onChange={(e) => setSelectedRestaurantId(e.target.value)}
      >
        <option value="">+ Add a new restaurant</option>
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>{r.name}{r.city ? ` – ${r.city}` : ""}</option>
        ))}
      </select>

      {!selectedRestaurantId && (
        <div className="grid gap-3 rounded-md border border-black/10 bg-rice/50 p-4">
          <div ref={photonRef} className="relative">
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Search restaurant
              <div className="relative">
                <Search size={15} className="absolute left-2.5 top-2.5 text-ink/30" />
                <input
                  className="w-full rounded-md border border-black/15 py-2 pl-8 pr-3 font-normal"
                  placeholder="Type restaurant name or address…"
                  value={restaurantQuery}
                  onChange={(e) => setRestaurantQuery(e.target.value)}
                  onFocus={() => photonResults.length > 0 && setPhotonOpen(true)}
                  autoComplete="off"
                />
                {photonLoading && (
                  <span className="absolute right-2.5 top-2 text-xs text-ink/40">searching…</span>
                )}
              </div>
              <p className="text-xs font-normal text-ink/40">Select a result to auto-fill details, or fill the fields below manually.</p>
            </label>
            {photonOpen && photonResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
                {photonResults.map((feat, i) => {
                  const p = feat.properties;
                  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
                  const location = [street, p.city].filter(Boolean).join(", ");
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectPhotonResult(feat)}
                      className="flex w-full flex-col px-3 py-2.5 text-left hover:bg-basil/5 border-b border-black/5 last:border-0"
                    >
                      <span className="text-sm font-semibold text-ink">{p.name ?? "Place"}</span>
                      <span className="text-xs text-ink/50">
                        {location || "No address"}
                        {p.country_code ? ` · ${p.country_code.toUpperCase()}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <input
            className="rounded-md border border-black/15 px-3 py-2"
            placeholder="Restaurant name *"
            maxLength={100}
            value={newRestaurantName}
            onChange={(e) => { setNewRestaurantName(e.target.value); clearPhotonCoords(); }}
          />
          <input
            className="rounded-md border border-black/15 px-3 py-2"
            placeholder="Street address (e.g. 123 Main St)"
            value={newRestaurantAddress}
            onChange={(e) => { setNewRestaurantAddress(e.target.value); clearPhotonCoords(); }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-md border border-black/15 px-3 py-2"
              placeholder="City"
              maxLength={100}
              value={newRestaurantCity}
              onChange={(e) => { setNewRestaurantCity(e.target.value); clearPhotonCoords(); }}
            />
            <input
              className="rounded-md border border-black/15 px-3 py-2"
              placeholder="Cuisine (e.g. Sichuan)"
              maxLength={80}
              value={newRestaurantCuisine}
              onChange={(e) => setNewRestaurantCuisine(e.target.value)}
            />
          </div>
          {newRestaurantLat !== null && (
            <p className="flex items-center gap-1 text-xs text-basil">
              ✓ Location pinpointed — exact map coordinates saved
            </p>
          )}
        </div>
      )}
    </div>
  );
}
