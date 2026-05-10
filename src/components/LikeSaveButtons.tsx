"use client";

import { useEffect, useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  dishId: string;
  initialLikes: number;
  initialSaves: number;
  compact?: boolean;
};

export function LikeSaveButtons({ dishId, initialLikes, initialSaves, compact }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [saves, setSaves] = useState(initialSaves);
  const [busy, setBusy] = useState(false);
  const [mutError, setMutError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [likeRes, saveRes] = await Promise.all([
        supabase.from("dish_likes").select("user_id").eq("dish_recommendation_id", dishId).eq("user_id", user.id).maybeSingle(),
        supabase.from("saved_dishes").select("user_id").eq("dish_recommendation_id", dishId).eq("user_id", user.id).maybeSingle(),
      ]);
      setLiked(!!likeRes.data);
      setSaved(!!saveRes.data);
    }
    init();
  }, [dishId]);

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!userId) { window.location.href = "/auth"; return; }
    setBusy(true);
    setMutError(null);
    if (liked) {
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
      const { error } = await supabase.from("dish_likes").delete().eq("dish_recommendation_id", dishId).eq("user_id", userId);
      if (error) { setLiked(true); setLikes((n) => n + 1); setMutError("Could not unlike. Try again."); }
    } else {
      setLiked(true);
      setLikes((n) => n + 1);
      const { error } = await supabase.from("dish_likes").insert({ dish_recommendation_id: dishId, user_id: userId });
      if (error) { setLiked(false); setLikes((n) => Math.max(0, n - 1)); setMutError("Could not like. Try again."); }
    }
    setBusy(false);
  }

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!userId) { window.location.href = "/auth"; return; }
    setBusy(true);
    setMutError(null);
    if (saved) {
      setSaved(false);
      setSaves((n) => Math.max(0, n - 1));
      const { error } = await supabase.from("saved_dishes").delete().eq("dish_recommendation_id", dishId).eq("user_id", userId);
      if (error) { setSaved(true); setSaves((n) => n + 1); setMutError("Could not unsave. Try again."); }
    } else {
      setSaved(true);
      setSaves((n) => n + 1);
      const { error } = await supabase.from("saved_dishes").insert({ dish_recommendation_id: dishId, user_id: userId });
      if (error) { setSaved(false); setSaves((n) => Math.max(0, n - 1)); setMutError("Could not save. Try again."); }
    }
    setBusy(false);
  }

  const base = compact
    ? "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors"
    : "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors";
  const iconSize = compact ? 13 : 15;

  return (
    <div className="flex flex-col gap-1">
      {mutError && <p className="text-xs text-tomato">{mutError}</p>}
      <div className="flex items-center gap-2">
      <button
        onClick={toggleLike}
        disabled={busy}
        aria-label="Like"
        className={`${base} ${liked ? "border-tomato/30 bg-tomato/10 text-tomato" : "border-black/10 bg-white text-ink/50 hover:border-tomato/30 hover:text-tomato"}`}
      >
        <Heart size={iconSize} className={liked ? "fill-tomato" : ""} />
        {likes}
      </button>
      <button
        onClick={toggleSave}
        disabled={busy}
        aria-label="Save"
        className={`${base} ${saved ? "border-basil/30 bg-basil/10 text-basil" : "border-black/10 bg-white text-ink/50 hover:border-basil/30 hover:text-basil"}`}
      >
        <Bookmark size={iconSize} className={saved ? "fill-basil" : ""} />
        {saves}
      </button>
      </div>
    </div>
  );
}
