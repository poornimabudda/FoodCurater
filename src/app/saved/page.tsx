"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronLeft, FolderOpen, Heart, ListPlus, Plus, Trash2, X } from "lucide-react";
import { DishCard } from "@/components/DishCard";
import { ShareButton } from "@/components/ShareButton";
import { TriedItButton } from "@/components/TriedItButton";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { SetupNotice } from "@/components/SetupNotice";
import type { CollectionRow, DishFeedItem, TryStatus } from "@/lib/types";

type SavedTab = "want" | "tried" | "collections";

export default function SavedPage() {
  const [savedDishes, setSavedDishes] = useState<DishFeedItem[]>([]);
  const [triedMap, setTriedMap] = useState<Record<string, TryStatus>>({});
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [collItemsMap, setCollItemsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SavedTab>("want");
  const [activeCollId, setActiveCollId] = useState<string | null>(null);
  const [newCollName, setNewCollName] = useState("");
  const [showNewColl, setShowNewColl] = useState(false);
  const [creatingColl, setCreatingColl] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (!user) { setLoading(false); return; }

      const [savedRes, triesRes, collRes] = await Promise.all([
        supabase.from("saved_dishes")
          .select("dish_recommendation_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("dish_tries")
          .select("dish_recommendation_id, status")
          .eq("user_id", user.id),
        supabase.from("collections")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      const ids = savedRes.data?.map((r) => r.dish_recommendation_id) ?? [];
      const collRows = (collRes.data ?? []) as CollectionRow[];

      let feedData: DishFeedItem[] = [];
      if (ids.length > 0) {
        const { data } = await supabase.from("dish_feed").select("*").in("id", ids);
        const orderMap = new Map(ids.map((id, i) => [id, i]));
        feedData = (data ?? []).sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      }

      const trMap: Record<string, TryStatus> = {};
      for (const row of triesRes.data ?? []) {
        trMap[row.dish_recommendation_id] = row.status as TryStatus;
      }

      let itemMap: Record<string, string[]> = {};
      if (collRows.length > 0) {
        const collIds = collRows.map((c) => c.id);
        const { data: itemRows } = await supabase
          .from("collection_items")
          .select("collection_id, dish_recommendation_id")
          .in("collection_id", collIds);
        for (const row of itemRows ?? []) {
          itemMap[row.collection_id] = [...(itemMap[row.collection_id] ?? []), row.dish_recommendation_id];
        }
      }

      setSavedDishes(feedData);
      setTriedMap(trMap);
      setCollections(collRows);
      setCollItemsMap(itemMap);
      setLoading(false);
    }
    load();
  }, []);

  // Close "add to list" picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setAddToListOpen(null);
      }
    }
    if (addToListOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addToListOpen]);

  function handleTriedChange(dishId: string, newStatus: TryStatus | null) {
    setTriedMap((prev) => {
      const next = { ...prev };
      if (newStatus === null) delete next[dishId];
      else next[dishId] = newStatus;
      return next;
    });
  }

  async function addToCollection(collectionId: string, dishId: string) {
    if (!supabase) return;
    await supabase.from("collection_items").upsert(
      { collection_id: collectionId, dish_recommendation_id: dishId },
      { onConflict: "collection_id,dish_recommendation_id" }
    );
    setCollItemsMap((prev) => ({
      ...prev,
      [collectionId]: Array.from(new Set([...(prev[collectionId] ?? []), dishId])),
    }));
    setAddToListOpen(null);
  }

  async function removeFromCollection(collectionId: string, dishId: string) {
    if (!supabase) return;
    await supabase.from("collection_items").delete()
      .eq("collection_id", collectionId)
      .eq("dish_recommendation_id", dishId);
    setCollItemsMap((prev) => ({
      ...prev,
      [collectionId]: (prev[collectionId] ?? []).filter((id) => id !== dishId),
    }));
  }

  async function createCollection() {
    if (!supabase || !userId || !newCollName.trim()) return;
    setCreatingColl(true);
    const { data, error } = await supabase.from("collections")
      .insert({ user_id: userId, name: newCollName.trim() })
      .select()
      .single();
    if (!error && data) {
      setCollections((prev) => [...prev, data as CollectionRow]);
      setCollItemsMap((prev) => ({ ...prev, [(data as CollectionRow).id]: [] }));
    }
    setNewCollName("");
    setShowNewColl(false);
    setCreatingColl(false);
  }

  async function deleteCollection(collId: string) {
    if (!supabase) return;
    await supabase.from("collections").delete().eq("id", collId);
    setCollections((prev) => prev.filter((c) => c.id !== collId));
    setCollItemsMap((prev) => { const n = { ...prev }; delete n[collId]; return n; });
    if (activeCollId === collId) setActiveCollId(null);
  }

  if (!isSupabaseConfigured) return <main className="mx-auto max-w-6xl px-4 py-10"><SetupNotice /></main>;
  if (loading) return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading saved dishes...</p></main>;

  if (!userId) return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-md border border-black/10 bg-white p-10 text-center shadow-soft">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-basil/10">
          <Bookmark size={26} className="text-basil" />
        </div>
        <p className="mt-4 text-lg font-semibold text-ink">Sign in to see your saved dishes</p>
        <Link href="/auth" className="mt-5 inline-flex rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black">Sign in</Link>
      </div>
    </main>
  );

  const wantDishes = savedDishes.filter((d) => !triedMap[d.id]);
  const triedDishes = savedDishes.filter((d) => !!triedMap[d.id]);

  const TABS: { key: SavedTab; label: string; count: number }[] = [
    { key: "want",        label: "Want to try",  count: wantDishes.length },
    { key: "tried",       label: "Tried",         count: triedDishes.length },
    { key: "collections", label: "Lists",         count: collections.length },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-3">
        <Bookmark size={22} className="text-basil" />
        <h1 className="text-3xl font-bold text-ink">Saved dishes</h1>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-md border border-black/10 bg-white p-1 shadow-soft w-fit">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setActiveTab(key); setActiveCollId(null); }}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === key ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === key ? "bg-white/20 text-white" : "bg-black/8 text-ink/50"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Want to try ───────────────────────────────── */}
      {activeTab === "want" && (
        wantDishes.length === 0 ? (
          <div className="mt-6 rounded-md border border-dashed border-black/20 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              {savedDishes.length === 0 ? "No saved dishes yet." : "You've tried everything you saved! 🎉"}
            </p>
            <p className="mt-2 text-sm text-ink/60">
              {savedDishes.length === 0
                ? "Browse the feed and tap the bookmark icon on any dish to save it."
                : "Head back to the feed to find more dishes."}
            </p>
            <Link href="/" className="mt-5 inline-flex rounded-md bg-basil px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
              Browse dishes
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wantDishes.map((dish) => (
              <div key={dish.id} className="flex flex-col">
                <DishCard dish={dish} />
                <div className="mt-2 flex items-center justify-between gap-3 px-1">
                  <TriedItButton dishId={dish.id} currentStatus={triedMap[dish.id] ?? null} onStatusChange={handleTriedChange} />
                  {collections.length > 0 && (
                    <div className="relative" ref={addToListOpen === dish.id ? pickerRef : undefined}>
                      <button
                        type="button"
                        onClick={() => setAddToListOpen((v) => (v === dish.id ? null : dish.id))}
                        className="flex items-center gap-1 text-xs text-ink/40 hover:text-ink/70"
                        title="Add to a list"
                      >
                        <ListPlus size={13} />
                        Add to list
                      </button>
                      {addToListOpen === dish.id && (
                        <div className="absolute bottom-full right-0 z-40 mb-1 w-48 overflow-hidden rounded-md border border-black/10 bg-white shadow-soft">
                          {collections.map((coll) => {
                            const inColl = (collItemsMap[coll.id] ?? []).includes(dish.id);
                            return (
                              <button
                                key={coll.id}
                                type="button"
                                onClick={() => inColl ? removeFromCollection(coll.id, dish.id) : addToCollection(coll.id, dish.id)}
                                className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-black/5"
                              >
                                <span className="truncate text-left">{coll.name}</span>
                                {inColl && <span className="ml-2 shrink-0 text-basil">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Tried ─────────────────────────────────────── */}
      {activeTab === "tried" && (
        triedDishes.length === 0 ? (
          <div className="mt-6 rounded-md border border-dashed border-black/20 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-ink">No tries logged yet.</p>
            <p className="mt-2 text-sm text-ink/60">Switch to &ldquo;Want to try&rdquo; and tap &ldquo;+ Mark as tried&rdquo; after a dish.</p>
            <button onClick={() => setActiveTab("want")} className="mt-4 text-sm font-medium text-basil hover:underline">Go to want to try</button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {triedDishes.map((dish) => (
                <div key={dish.id} className="flex flex-col">
                  <DishCard dish={dish} />
                  <div className="mt-2 px-1">
                    <TriedItButton dishId={dish.id} currentStatus={triedMap[dish.id] ?? null} onStatusChange={handleTriedChange} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-saffron/30 bg-saffron/5 px-6 py-8 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-saffron/20">
                <Heart size={22} className="text-saffron" />
              </div>
              <p className="font-semibold text-ink">Loved a dish? Help fellow food lovers.</p>
              <p className="max-w-sm text-sm text-ink/60">
                Your honest take — what made it special, who should order it — could be exactly what someone needs before they decide.
              </p>
              <Link
                href="/recommendations/new"
                className="mt-1 inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Post your recommendation
              </Link>
            </div>
          </>
        )
      )}

      {/* ── Collections ───────────────────────────────── */}
      {activeTab === "collections" && (
        activeCollId ? (
          // Viewing a single collection
          (() => {
            const coll = collections.find((c) => c.id === activeCollId);
            const dishIds = new Set(collItemsMap[activeCollId] ?? []);
            const collDishes = savedDishes.filter((d) => dishIds.has(d.id));
            return (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setActiveCollId(null)}
                  className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink"
                >
                  <ChevronLeft size={16} />Back to lists
                </button>
                <h2 className="text-xl font-bold text-ink">{coll?.name}</h2>
                <p className="mt-1 text-sm text-ink/50">{collDishes.length} {collDishes.length === 1 ? "dish" : "dishes"}</p>
                {collDishes.length === 0 ? (
                  <div className="mt-6 rounded-md border border-dashed border-black/20 bg-white p-8 text-center">
                    <p className="text-ink/60">No dishes in this list yet.</p>
                    <p className="mt-1 text-sm text-ink/40">Use &ldquo;Add to list&rdquo; under saved dishes to add here.</p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {collDishes.map((dish) => (
                      <div key={dish.id} className="flex flex-col">
                        <DishCard dish={dish} />
                        <div className="mt-2 px-1">
                          <button
                            type="button"
                            onClick={() => removeFromCollection(activeCollId, dish.id)}
                            className="flex items-center gap-1 text-xs text-ink/40 hover:text-tomato"
                          >
                            <X size={12} />Remove from list
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          // Collections list view
          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-ink/50">{collections.length} {collections.length === 1 ? "list" : "lists"}</p>
              {!showNewColl && (
                <button
                  type="button"
                  onClick={() => setShowNewColl(true)}
                  className="flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5"
                >
                  <Plus size={14} />New list
                </button>
              )}
            </div>

            {showNewColl && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-basil/30 bg-basil/5 px-4 py-3">
                <FolderOpen size={16} className="shrink-0 text-basil" />
                <input
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
                  placeholder="List name, e.g. Ramen to try"
                  value={newCollName}
                  maxLength={60}
                  onChange={(e) => setNewCollName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") createCollection(); if (e.key === "Escape") setShowNewColl(false); }}
                />
                <button
                  type="button"
                  disabled={!newCollName.trim() || creatingColl}
                  onClick={createCollection}
                  className="shrink-0 rounded-md bg-basil px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 hover:opacity-90"
                >
                  Create
                </button>
                <button type="button" onClick={() => setShowNewColl(false)} className="shrink-0 text-ink/40 hover:text-ink"><X size={14} /></button>
              </div>
            )}

            {collections.length === 0 && !showNewColl ? (
              <div className="mt-6 rounded-md border border-dashed border-black/20 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-ink">No lists yet.</p>
                <p className="mt-2 text-sm text-ink/60">Create a list to organise dishes — &ldquo;Weekend ramen run&rdquo;, &ldquo;Date night ideas&rdquo;, whatever.</p>
                <button
                  type="button"
                  onClick={() => setShowNewColl(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-basil px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <Plus size={14} />Create first list
                </button>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((coll) => {
                  const count = (collItemsMap[coll.id] ?? []).length;
                  return (
                    <div key={coll.id} className="flex items-start justify-between gap-3 rounded-md border border-black/10 bg-white p-4 shadow-soft">
                      <button
                        type="button"
                        onClick={() => setActiveCollId(coll.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="font-semibold text-ink hover:underline">{coll.name}</p>
                        <p className="mt-0.5 text-xs text-ink/50">{count} {count === 1 ? "dish" : "dishes"}</p>
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <ShareButton
                          title={`${coll.name} – Dish Curator`}
                          path={`/collections/${coll.id}`}
                          className="rounded p-1 text-ink/30 hover:text-ink/70"
                        />
                        <button
                          type="button"
                          onClick={() => deleteCollection(coll.id)}
                          className="rounded p-1 text-ink/30 hover:text-tomato"
                          title="Delete list"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}
    </main>
  );
}
