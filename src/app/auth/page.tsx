"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/profile`
      }
    });

    setMessage(error ? error.message : "Check your email for the sign-in link.");
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-md border border-black/10 bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-bold text-ink">Sign in</h1>
        <p className="mt-2 leading-7 text-ink/70">Use a magic link to create recommendations and manage your curator profile.</p>
        {!isSupabaseConfigured ? (
          <div className="mt-6">
            <SetupNotice />
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={sendMagicLink}>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Email</span>
              <input
                className="mt-2 w-full rounded-md border border-black/15 px-3 py-2 outline-none focus:border-basil"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-semibold text-white" disabled={loading}>
              <LogIn size={18} />
              {loading ? "Sending..." : "Send magic link"}
            </button>
            {message ? <p className="text-sm text-ink/70">{message}</p> : null}
          </form>
        )}
      </div>
    </main>
  );
}
