"use client";

import { useState } from "react";
import { CheckCircle, Send } from "lucide-react";

const CATEGORIES = [
  "Bug report",
  "Feature request",
  "Content issue",
  "Account help",
  "Other",
];

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Bug report");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) { setError("Please describe the issue."); return; }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not send. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle size={48} className="mx-auto text-basil" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Message sent!</h1>
        <p className="mt-2 text-ink/60">Thanks for reaching out. We&apos;ll look into it and get back to you if needed.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Contact support</h1>
      <p className="mt-1 text-sm text-ink/60">
        Found a bug, have a question, or want to share feedback? We&apos;d love to hear from you.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-sm font-semibold">
          Name <span className="font-normal text-ink/40">(optional)</span>
          <input
            className="rounded-md border border-black/15 px-3 py-2 font-normal"
            placeholder="Your name"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold">
          Email <span className="font-normal text-ink/40">(optional — for a reply)</span>
          <input
            type="email"
            className="rounded-md border border-black/15 px-3 py-2 font-normal"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold">
          Category
          <select
            className="rounded-md border border-black/15 px-3 py-2 font-normal"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold">
          Message <span className="text-tomato">*</span>
          <textarea
            className="min-h-32 w-full rounded-md border border-black/15 px-3 py-2 font-normal"
            placeholder="Describe the issue or your question…"
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-tomato">{error}</p>}

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-5 py-2.5 font-semibold text-white hover:bg-black disabled:opacity-50"
        >
          <Send size={16} />
          {sending ? "Sending…" : "Send message"}
        </button>
      </form>
    </main>
  );
}
