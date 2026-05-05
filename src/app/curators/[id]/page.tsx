import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { CuratorPageClient } from "./CuratorPageClient";
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
    .from("profiles")
    .select("display_name, city, curator_type, bio")
    .eq("id", params.id)
    .single();

  if (!data) return { title: "Curator – Dish Curator" };

  const title = `${data.display_name} – Dish Curator`;
  const description = data.bio ?? `${data.display_name} is a ${data.curator_type?.replace(/_/g, " ") ?? "curator"}${data.city ? ` based in ${data.city}` : ""} on Dish Curator.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description },
  };
}

export default function CuratorPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10"><p className="text-ink/60">Loading curator...</p></main>}>
      <CuratorPageClient id={params.id} />
    </Suspense>
  );
}
