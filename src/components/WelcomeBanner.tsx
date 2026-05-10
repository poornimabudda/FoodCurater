"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, X } from "lucide-react";

const STORAGE_KEY = "dc_welcomed";

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!safeGet(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    safeSet(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="border-b border-basil/20 bg-basil/5">
      <div className="mx-auto flex max-w-6xl items-start gap-4 px-4 py-5 sm:items-center">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-basil/15">
          <ChefHat size={20} className="text-basil" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink">Welcome to Dish Curator</p>
          <p className="mt-0.5 text-sm leading-6 text-ink/70">
            Real recommendations for specific dishes — not generic restaurant ratings. Find exactly what to order, or share dishes you personally loved.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={dismiss}
              className="rounded-md bg-basil px-4 py-1.5 text-sm font-semibold text-white hover:bg-basil/90"
            >
              Browse dishes
            </button>
            <Link
              href="/how-it-works"
              onClick={dismiss}
              className="rounded-md border border-basil/30 px-4 py-1.5 text-sm font-semibold text-basil hover:bg-basil/10"
            >
              How it works
            </Link>
            <Link
              href="/auth"
              onClick={dismiss}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-ink/60 hover:text-ink"
            >
              Become a curator →
            </Link>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-ink/40 hover:bg-black/5 hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
