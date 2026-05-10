"use client";

import { useEffect, useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";

type Props = {
  curatorId: string;
  viewerId: string;
  onFollowChange?: (delta: 1 | -1) => void;
};

export function FollowButton({ curatorId, viewerId, onFollowChange }: Props) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", curatorId)
      .maybeSingle()
      .then(({ data }) => {
        setFollowing(!!data);
        setLoading(false);
      });
  }, [viewerId, curatorId]);

  async function toggle() {
    if (!supabase || loading) return;
    setLoading(true);
    if (following) {
      setFollowing(false);
      onFollowChange?.(-1);
      const { error } = await supabase.from("follows").delete().eq("follower_id", viewerId).eq("following_id", curatorId);
      if (error) { setFollowing(true); onFollowChange?.(1); showToast("Could not unfollow. Try again.", "error"); }
    } else {
      setFollowing(true);
      onFollowChange?.(1);
      const { error } = await supabase.from("follows").insert({ follower_id: viewerId, following_id: curatorId });
      if (error) { setFollowing(false); onFollowChange?.(-1); showToast("Could not follow. Try again.", "error"); }
      else showToast("Following!");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {toast && (
        <p className={`text-xs font-medium ${toast.kind === "error" ? "text-tomato" : "text-basil"}`}>
          {toast.msg}
        </p>
      )}
      <button
        onClick={toggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
          following
            ? "border border-black/15 bg-white text-ink hover:bg-black/5"
            : "bg-basil text-white hover:opacity-90"
        }`}
      >
        {following ? <UserMinus size={14} /> : <UserPlus size={14} />}
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
