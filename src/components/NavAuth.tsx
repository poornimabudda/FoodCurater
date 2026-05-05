"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BarChart2, Bookmark, ChevronDown, LogOut, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function NavAuth() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadUser(user.id);
      else { setDisplayName(null); setLoading(false); }
    });

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function signOut() {
    if (!supabase) return;
    setOpen(false);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return null;

  if (displayName) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-black/5"
        >
          <UserRound size={16} />
          <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-black/10 bg-white py-1 shadow-lg">
            <Link
              href="/saved"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5"
            >
              <Bookmark size={15} />
              Saved
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5"
            >
              <BarChart2 size={15} />
              Dashboard
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5"
            >
              <UserRound size={15} />
              Profile
            </Link>
            <div className="my-1 border-t border-black/10" />
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
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
