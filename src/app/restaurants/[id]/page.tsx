import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { RestaurantDetailClient } from "./RestaurantDetailClient";
import type { Database } from "@/lib/types";

function serverSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const sb = serverSupabase();
  const { data } = await sb
    .from("restaurants")
    .select("name, city, state, cuisine")
    .eq("id", params.id)
    .single();

  if (!data) return { title: "Restaurant – Dish Curator" };

  const location = [data.city, data.state].filter(Boolean).join(", ");
  const title = `${data.name}${location ? ` in ${location}` : ""} – Dish Curator`;
  const description = `Dish recommendations at ${data.name}${data.cuisine ? ` (${data.cuisine})` : ""}${location ? ` in ${location}` : ""} on Dish Curator.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default function RestaurantDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading restaurant...</p></main>}>
      <RestaurantDetailClient id={params.id} />
    </Suspense>
  );
}
