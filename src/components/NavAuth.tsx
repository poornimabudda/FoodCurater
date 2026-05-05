"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function NavAuth() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    async function loadUser(userId: string) {
      if (!supabase) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      setDisplayName(data?.display_name ?? null);
      setLoading(false);
    }

    // Check current session immediately
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadUser(user.id);
      else { setDisplayName(null); setLoading(false); }
    });

    // React to magic-link sign-in, sign-out, token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setDisplayName(null);
        setLoading(false);
      } else if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        loadUser(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // Don't flash anything while checking
  if (loading) return null;

  if (displayName) {
    return (
      <>
        <Link
          href="/profile"
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-black/5"
          title="Edit profile"
        >
          <UserRound size={16} />
          <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
        </Link>
        <button
          onClick={signOut}
          className="rounded-md p-2 text-ink/50 hover:bg-black/5 hover:text-ink"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </>
    );
  }

  return (
    <Link
      href="/auth"
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-black/5"
    >
      <UserRound size={16} />
      <span className="hidden sm:inline">Sign in</span>
    </Link>
  );
}
