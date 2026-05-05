"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Save } from "lucide-react";
import { SetupNotice } from "@/components/SetupNotice";
import { curatorTypes } from "@/lib/constants";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ProfileRow } from "@/lib/types";

type ProfileForm = {
  display_name: string;
  city: string;
  curator_type: string;
  bio: string;
};

const emptyProfile: ProfileForm = {
  display_name: "",
  city: "",
  curator_type: "foodie",
  bio: ""
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  useEffect(() => {
    async function loadProfile() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setUserId(user?.id ?? null);
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("display_name, city, curator_type, bio")
        .eq("id", user.id)
        .maybeSingle<Pick<ProfileRow, "display_name" | "city" | "curator_type" | "bio">>();
      if (data) {
        setProfile({
          display_name: data.display_name ?? "",
          city: data.city ?? "",
          curator_type: data.curator_type ?? "foodie",
          bio: data.bio ?? ""
        });
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId) return;

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: profile.display_name,
      city: profile.city,
      curator_type: profile.curator_type,
      bio: profile.bio
    });

    setMessage(error ? error.message : "Profile saved.");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-ink">Curator profile</h1>
      <p className="mt-2 text-ink/70">Tell people why they should trust your dish recommendations.</p>
      {!isSupabaseConfigured ? <div className="mt-6"><SetupNotice /></div> : null}
      {loading ? <p className="mt-6 text-ink/60">Loading profile...</p> : null}
      {!loading && isSupabaseConfigured && !userId ? (
        <div className="mt-6 rounded-md border border-black/10 bg-white p-6 shadow-soft">
          <p className="font-semibold text-ink">Sign in to create your profile.</p>
          <Link className="mt-3 inline-flex rounded-md bg-ink px-4 py-2 font-semibold text-white" href="/auth">
            Go to sign in
          </Link>
        </div>
      ) : null}
      {userId ? (
        <form className="mt-6 grid gap-4 rounded-md border border-black/10 bg-white p-6 shadow-soft" onSubmit={saveProfile}>
          <label>
            <span className="text-sm font-semibold">Display name</span>
            <input className="mt-2 w-full rounded-md border border-black/15 px-3 py-2" value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-sm font-semibold">City</span>
              <input className="mt-2 w-full rounded-md border border-black/15 px-3 py-2" value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} />
            </label>
            <label>
              <span className="text-sm font-semibold">Curator type</span>
              <select className="mt-2 w-full rounded-md border border-black/15 px-3 py-2" value={profile.curator_type} onChange={(event) => setProfile({ ...profile, curator_type: event.target.value })}>
                {curatorTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span className="text-sm font-semibold">Bio</span>
            <textarea className="mt-2 min-h-28 w-full rounded-md border border-black/15 px-3 py-2" value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex w-fit items-center gap-2 rounded-md bg-basil px-4 py-2 font-semibold text-white">
              <Save size={18} />
              Save profile
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-black/5 hover:text-ink"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
          {message ? <p className="text-sm text-ink/70">{message}</p> : null}
        </form>
      ) : null}
    </main>
  );
}
