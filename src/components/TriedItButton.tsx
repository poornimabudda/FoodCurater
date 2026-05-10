"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { TryStatus } from "@/lib/types";

const STATUS_CONFIG: Record<TryStatus, { emoji: string; label: string }> = {
  loved_it: { emoji: "❤️", label: "Loved it" },
  okay:     { emoji: "👍", label: "Okay" },
  skip:     { emoji: "👎", label: "Would skip" },
};

interface TriedItButtonProps {
  dishId: string;
  currentStatus: TryStatus | null;
  onStatusChange: (dishId: string, newStatus: TryStatus | null) => void;
}

export function TriedItButton({ dishId, currentStatus, onStatusChange }: TriedItButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function markAsTried(status: TryStatus) {
    if (!supabase || saving) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      window.location.href = "/auth";
      return;
    }
    const { error } = await supabase.from("dish_tries").upsert(
      { user_id: user.id, dish_recommendation_id: dishId, status },
      { onConflict: "user_id,dish_recommendation_id" }
    );
    if (!error) onStatusChange(dishId, status);
    setSaving(false);
    setOpen(false);
  }

  async function unmark() {
    if (!supabase || saving) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      window.location.href = "/auth";
      return;
    }
    const { error } = await supabase.from("dish_tries")
      .delete()
      .eq("user_id", user.id)
      .eq("dish_recommendation_id", dishId);
    if (!error) onStatusChange(dishId, null);
    setSaving(false);
  }

  if (currentStatus && !open) {
    const { emoji, label } = STATUS_CONFIG[currentStatus];
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-ink/60">{emoji} {label}</span>
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-ink/40 hover:text-ink/70">
          Change
        </button>
        <button type="button" onClick={unmark} disabled={saving} className="text-xs text-ink/40 hover:text-tomato disabled:opacity-40">
          Undo
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-basil hover:underline">
        + Mark as tried
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(Object.entries(STATUS_CONFIG) as [TryStatus, { emoji: string; label: string }][]).map(([status, { emoji, label }]) => (
        <button
          key={status}
          type="button"
          disabled={saving}
          onClick={() => markAsTried(status)}
          className="rounded-full border border-black/15 px-2.5 py-1 text-xs font-medium hover:border-basil hover:text-basil disabled:opacity-40"
        >
          {emoji} {label}
        </button>
      ))}
      <button type="button" onClick={() => setOpen(false)} className="px-1 text-xs text-ink/40">✕</button>
    </div>
  );
}
