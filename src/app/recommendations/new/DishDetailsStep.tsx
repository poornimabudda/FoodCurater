"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { AVAILABILITY_OPTIONS, courseTypes } from "@/lib/constants";

export type DishDetailsState = {
  dishName: string;
  description: string;
  highlight: string;
  rating: number;
  priceEstimate: string;
  isVegetarian: boolean;
  spiceLevel: number;
  isPersonallyTasted: boolean;
  courseType: string;
  pairsWellWith: string;
  availability: string;
};

type Props = DishDetailsState & {
  setDishName: (v: string) => void;
  setDescription: (v: string) => void;
  setHighlight: (v: string) => void;
  setRating: (v: number) => void;
  setPriceEstimate: (v: string) => void;
  setIsVegetarian: (v: boolean) => void;
  setSpiceLevel: (v: number) => void;
  setIsPersonallyTasted: (v: boolean) => void;
  setCourseType: (v: string) => void;
  setPairsWellWith: (v: string) => void;
  setAvailability: (v: string) => void;
};

export function DishDetailsStep({
  dishName, setDishName,
  description, setDescription,
  highlight, setHighlight,
  rating, setRating,
  priceEstimate, setPriceEstimate,
  isVegetarian, setIsVegetarian,
  spiceLevel, setSpiceLevel,
  isPersonallyTasted, setIsPersonallyTasted,
  courseType, setCourseType,
  pairsWellWith, setPairsWellWith,
  availability, setAvailability,
}: Props) {
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const beforeImproveRef = useRef<string | null>(null);

  async function improveDescription() {
    if (improving || description.trim().length < 10) return;
    setImproving(true);
    setImproveError(null);
    beforeImproveRef.current = description;
    try {
      const res = await fetch("/api/improve-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) { setImproveError(data.error ?? "Could not improve. Try again."); beforeImproveRef.current = null; }
      else setDescription(data.improved);
    } catch {
      setImproveError("Could not reach AI. Try again.");
      beforeImproveRef.current = null;
    } finally {
      setImproving(false);
    }
  }

  function revertDescription() {
    if (beforeImproveRef.current !== null) {
      setDescription(beforeImproveRef.current);
      beforeImproveRef.current = null;
      setImproveError(null);
    }
  }

  return (
    <div className="grid gap-4">
      <input
        className="rounded-md border border-black/15 px-3 py-2"
        placeholder="Dish name *"
        maxLength={100}
        value={dishName}
        onChange={(e) => setDishName(e.target.value)}
      />
      <div>
        <textarea
          className="min-h-28 w-full rounded-md border border-black/15 px-3 py-2"
          placeholder="Taste notes: texture, spice, portion, why you recommend it"
          maxLength={1000}
          value={description}
          onChange={(e) => { setDescription(e.target.value); beforeImproveRef.current = null; }}
        />
        <div className="mt-1.5 flex items-center gap-3">
          <button
            type="button"
            onClick={improveDescription}
            disabled={improving || description.trim().length < 10}
            className="inline-flex items-center gap-1.5 rounded-md bg-saffron/10 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-saffron/20 disabled:opacity-40 transition-colors"
          >
            <Sparkles size={13} className="text-saffron" />
            {improving ? "Polishing…" : "✨ Polish writing"}
          </button>
          {beforeImproveRef.current !== null && (
            <button
              type="button"
              onClick={revertDescription}
              className="text-xs text-ink/40 hover:text-ink/70 hover:underline"
            >
              Revert to original
            </button>
          )}
          {improveError && <p className="text-xs text-tomato">{improveError}</p>}
        </div>
      </div>
      <div>
        <input
          className="w-full rounded-md border border-black/15 px-3 py-2"
          placeholder="What makes this dish special here? (optional)"
          maxLength={200}
          value={highlight}
          onChange={(e) => setHighlight(e.target.value)}
        />
        <p className="mt-1 text-xs text-ink/40">e.g. House-made XO sauce, only available at this branch</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          Course type
          <select className="rounded-md border border-black/15 px-3 py-2 font-normal" value={courseType} onChange={(e) => setCourseType(e.target.value)}>
            <option value="">Not specified</option>
            {courseTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Availability
          <select className="rounded-md border border-black/15 px-3 py-2 font-normal" value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">Not specified</option>
            {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          Pairs well with
          <input className="rounded-md border border-black/15 px-3 py-2 font-normal" placeholder="e.g. garlic naan, mango lassi" maxLength={200} value={pairsWellWith} onChange={(e) => setPairsWellWith(e.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Price ($)
          <input type="number" min="0" step="0.5" className="rounded-md border border-black/15 px-3 py-2 font-normal" value={priceEstimate} onChange={(e) => setPriceEstimate(e.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          Rating (0.5–5)
          <input type="number" min="0.5" max="5" step="0.5" className="rounded-md border border-black/15 px-3 py-2 font-normal" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Spice level (0–5)
          <input type="number" min="0" max="5" step="1" className="rounded-md border border-black/15 px-3 py-2 font-normal" value={spiceLevel} onChange={(e) => setSpiceLevel(Number(e.target.value))} />
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={isVegetarian} onChange={(e) => setIsVegetarian(e.target.checked)} />
          Vegetarian
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={isPersonallyTasted} onChange={(e) => setIsPersonallyTasted(e.target.checked)} />
          Personally tasted
        </label>
      </div>
    </div>
  );
}
