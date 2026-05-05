import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { DishDetailClient } from "./DishDetailClient";
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
    .from("dish_recommendations")
    .select("dish_name, description, image_url, restaurant:restaurants(name, city)")
    .eq("id", params.id)
    .single();

  if (!data) return { title: "Dish not found – Dish Curator" };

  const restaurant = data.restaurant as { name: string; city: string | null } | null;
  const title = `${data.dish_name}${restaurant?.name ? ` at ${restaurant.name}` : ""} – Dish Curator`;
  const description = data.description ?? `A trusted dish recommendation on Dish Curator${restaurant?.city ? ` in ${restaurant.city}` : ""}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.image_url ? [{ url: data.image_url, width: 1200, height: 630, alt: data.dish_name }] : [],
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function DishDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10"><p className="text-ink/60">Loading dish...</p></main>}>
      <DishDetailClient id={params.id} />
    </Suspense>
  );
}
