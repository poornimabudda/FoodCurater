"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Camera, ChefHat, Filter, PlusCircle, Search, Star, User } from "lucide-react";

type Tab = "finding" | "recommending";

type Step = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const findingSteps: Step[] = [
  {
    icon: <Search size={22} />,
    title: "Browse the feed",
    description: "The home feed shows dish recommendations from real curators who personally tasted each dish — not anonymous star ratings.",
  },
  {
    icon: <Filter size={22} />,
    title: "Filter to your taste",
    description: "Narrow by cuisine, price, spice level, dietary needs (vegan, gluten-free, halal, and more), or search by dish name or tag.",
  },
  {
    icon: <Star size={22} />,
    title: "Read the full dish detail",
    description: "Each recommendation includes taste notes, course type, what it pairs with, curator photos, and the context you need to order confidently.",
  },
  {
    icon: <Bookmark size={22} />,
    title: "Save dishes for later",
    description: "Tap the bookmark on any dish to save it. Find everything you saved under the Saved tab — great for planning visits.",
  },
];

const recommendingSteps: Step[] = [
  {
    icon: <User size={22} />,
    title: "Sign up in seconds",
    description: "Enter your email and we send a magic link — no password to remember. Your account is ready instantly.",
  },
  {
    icon: <ChefHat size={22} />,
    title: "Set up your profile",
    description: "Tell us your curator type (foodie, restaurant staff, expert in a cuisine), your city, and a short bio so others know whose taste they're trusting.",
  },
  {
    icon: <Camera size={22} />,
    title: "Post a dish recommendation",
    description: "Pick the restaurant, name the dish, describe the taste honestly, choose a course type and tags, add what it pairs well with, and upload up to 4 photos. At least one real photo is required.",
  },
  {
    icon: <BadgeCheck size={22} />,
    title: "Build your reputation",
    description: "Your recommendations appear in the public feed and on your curator profile. Post consistently in a niche and you'll earn expertise badges — Spicy Expert, Sichuan Specialist, and so on.",
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  return (
    <div className="flex gap-4 rounded-md border border-black/10 bg-white p-5 shadow-soft">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-basil/10 text-basil">
        {step.icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-basil">0{index + 1}</span>
          <h3 className="font-semibold text-ink">{step.title}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-ink/70">{step.description}</p>
      </div>
    </div>
  );
}

const faqs = [
  { q: "Is Dish Curator free?", a: "Yes — completely free for both browsers and curators." },
  { q: "Who are curators?", a: "Anyone who has personally tasted a dish and wants to share an honest recommendation. Foodies, chefs, restaurant staff, and everyday diners all qualify." },
  { q: "Why do you require a photo?", a: "A real photo of the actual dish sets expectations and builds trust. Stock images and screenshots from menus are not allowed." },
  { q: "Where are photos stored?", a: "Photos are uploaded to Supabase Storage (a secure cloud bucket) and linked to your recommendation. They're publicly viewable once posted." },
  { q: "How do expertise badges work?", a: "After you post 2 or more recommendations that share a tag or cuisine, your curator profile automatically shows the relevant badge — like Spicy Expert or Italian Specialist." },
  { q: "Can I edit or delete a recommendation?", a: "Editing is coming soon. For now, contact support if you need a post removed." },
];

export default function HowItWorksPage() {
  const [tab, setTab] = useState<Tab>("finding");

  const steps = tab === "finding" ? findingSteps : recommendingSteps;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-basil">Guide</p>
        <h1 className="mt-2 text-4xl font-bold text-ink">How Dish Curator works</h1>
        <p className="mt-3 text-lg leading-8 text-ink/70">
          Dish-level recommendations from people who actually ate the food.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="mt-10 flex rounded-md border border-black/10 bg-white p-1 shadow-soft">
        <button
          onClick={() => setTab("finding")}
          className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors ${tab === "finding" ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
        >
          I want to find dishes to order
        </button>
        <button
          onClick={() => setTab("recommending")}
          className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors ${tab === "recommending" ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
        >
          I want to recommend dishes
        </button>
      </div>

      {/* Steps */}
      <div className="mt-6 grid gap-4">
        {steps.map((step, i) => <StepCard key={step.title} step={step} index={i} />)}
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {tab === "finding" ? (
          <Link href="/" className="rounded-md bg-basil px-5 py-2.5 font-semibold text-white hover:bg-basil/90">
            Browse the feed
          </Link>
        ) : (
          <>
            <Link href="/auth" className="rounded-md bg-ink px-5 py-2.5 font-semibold text-white hover:bg-black">
              Sign up and start curating
            </Link>
            <Link href="/recommendations/new" className="inline-flex items-center gap-2 rounded-md border border-black/15 px-5 py-2.5 font-semibold text-ink hover:bg-black/5">
              <PlusCircle size={16} />Post your first dish
            </Link>
          </>
        )}
      </div>

      {/* FAQ */}
      <div className="mt-14">
        <h2 className="text-xl font-bold text-ink">Frequently asked questions</h2>
        <div className="mt-5 divide-y divide-black/10 rounded-md border border-black/10 bg-white shadow-soft">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group px-5 py-4">
              <summary className="cursor-pointer select-none list-none font-semibold text-ink group-open:text-basil">
                {q}
              </summary>
              <p className="mt-2 text-sm leading-6 text-ink/70">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
