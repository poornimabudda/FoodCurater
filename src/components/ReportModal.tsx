"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const MAX_REASON = 1000;

export function ReportModal({ dishId, onClose }: { dishId: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length > MAX_REASON || !supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }

    setSubmitting(true);
    await supabase.from("content_reports").insert({
      dish_recommendation_id: dishId,
      reporter_id: user.id,
      reason: trimmed,
    });
    setDone(true);
    setSubmitting(false);
  }

  const overLimit = reason.length > MAX_REASON;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Report this dish</h2>
          <button onClick={onClose} className="rounded p-1 text-ink/50 hover:bg-black/5 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-ink/70">Thanks for the report. We&apos;ll review it shortly.</p>
            <button onClick={onClose} className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink/60">Tell us what&apos;s wrong with this recommendation.</p>
            <textarea
              className={`mt-4 w-full rounded-md border bg-rice px-3 py-2 text-sm outline-none focus:border-basil ${overLimit ? "border-tomato" : "border-black/15"}`}
              rows={4}
              placeholder="Describe the issue..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className={`mt-1 text-right text-xs ${overLimit ? "text-tomato" : "text-ink/40"}`}>
              {reason.length} / {MAX_REASON}
            </p>
            <div className="mt-3 flex justify-end gap-3">
              <button onClick={onClose} className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!reason.trim() || overLimit || submitting}
                className="rounded-md bg-tomato px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
