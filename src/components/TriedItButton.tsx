"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
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
  const { toast, showToast } = useToast();

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
    if (!error) {
      onStatusChange(dishId, status);
      showToast(`Marked as ${STATUS_CONFIG[status].label.toLowerCase()}!`);
    } else {
      showToast("Could not save. Try again.", "error");
    }
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
    if (!error) {
      onStatusChange(dishId, null);
    } else {
      showToast("Could not undo. Try again.", "error");
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-1">
      {toast && (
        <p className={`text-xs font-medium ${toast.kind === "error" ? "text-tomato" : "text-basil"}`}>
          {toast.msg}
        </p>
      )}
      {currentStatus && !open ? (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink/60">
            {STATUS_CONFIG[currentStatus].emoji} {STATUS_CONFIG[currentStatus].label}
          </span>
          <button type="button" onClick={() => setOpen(true)} className="text-xs text-ink/40 hover:text-ink/70">
            Change
          </button>
          <button type="button" onClick={unmark} disabled={saving} className="text-xs text-ink/40 hover:text-tomato disabled:opacity-40">
            Undo
          </button>
        </div>
      ) : !open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-basil hover:underline">
          + Mark as tried
        </button>
      ) : (
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
      )}
    </div>
  );
}
