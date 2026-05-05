import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { CollectionPageClient } from "./CollectionPageClient";
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
    .from("collections")
    .select("name, user_id")
    .eq("id", params.id)
    .single();

  if (!data) return { title: "Collection not found – Dish Curator" };

  const title = `${data.name} – Dish Curator`;
  const description = `A curated dish collection on Dish Curator.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default function CollectionPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading collection...</p></main>}>
      <CollectionPageClient id={params.id} />
    </Suspense>
  );
}
