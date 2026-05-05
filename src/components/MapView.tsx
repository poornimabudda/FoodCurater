"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

export type MapRestaurant = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dishCount: number;
  topDish: string | null;
};

type Props = {
  restaurants: MapRestaurant[];
  onMarkerClick: (restaurant: MapRestaurant) => void;
};

export function MapView({ restaurants, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Leaflet must be imported dynamically in Next.js to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default marker icon paths broken by webpack
      const proto = L.Icon.Default.prototype as unknown as Record<string, unknown>;
      delete proto._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const defaultCenter: [number, number] = restaurants.length > 0
        ? [restaurants[0].lat, restaurants[0].lng]
        : [40.7128, -74.006]; // NYC fallback

      const map = L.map(containerRef.current!).setView(defaultCenter, 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      restaurants.forEach((r) => {
        const popup = L.popup().setContent(
          `<div style="min-width:160px">
            <p style="font-weight:700;font-size:14px;margin:0 0 4px">${r.name}</p>
            ${r.topDish ? `<p style="font-size:12px;color:#555;margin:0 0 2px">Top dish: ${r.topDish}</p>` : ""}
            <p style="font-size:12px;color:#888;margin:0">${r.dishCount} recommendation${r.dishCount !== 1 ? "s" : ""}</p>
          </div>`
        );
        L.marker([r.lat, r.lng])
          .bindPopup(popup)
          .addTo(map)
          .on("click", () => onMarkerClick(r));
      });

      // Fit map to markers if any
      if (restaurants.length > 1) {
        const group = L.featureGroup(restaurants.map((r) => L.marker([r.lat, r.lng])));
        map.fitBounds(group.getBounds().pad(0.2));
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-full w-full rounded-md" />;
}
