"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Camera, ChefHat, Compass, Filter, FolderOpen, MapPin, PlusCircle, Search, Star, User } from "lucide-react";

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
    description:
      "The home feed shows dish recommendations from curators who personally tasted each dish. Use quick-tap chips (🌶️ Spicy, 🌿 Vegan, Under $20, ⭐ 4+) or the search bar to narrow results instantly. Signed-in users see a personalised For you tab built from their saved dishes.",
  },
  {
    icon: <Filter size={22} />,
    title: "Filter and search",
    description:
      "Drill down by cuisine, price ceiling, spice level, or dietary needs (vegan, gluten-free, halal, keto-friendly, and more). The search dropdown auto-suggests dish names, cuisines, and tags as you type.",
  },
  {
    icon: <Compass size={22} />,
    title: "Explore by map or cuisine",
    description:
      "The Map page shows every restaurant with recommendations on an interactive map — pan and zoom to discover dishes in your area. The Explore page lets you browse by cuisine hero or dive into a tag like crispy or must_try.",
  },
  {
    icon: <Star size={22} />,
    title: "Read the full dish detail",
    description:
      "Each recommendation includes taste notes, what makes the dish special at that spot, availability (lunch/dinner/seasonal), course type, pairing suggestions, curator photos, and the context you need to order confidently.",
  },
  {
    icon: <Bookmark size={22} />,
    title: "Save, track, and organise",
    description:
      "Bookmark any dish to your Saved list. After you eat it, mark it as Loved it / Okay / Would skip in your Tried diary. Group saved dishes into named collections — Ramen to try, Date night, etc. — and share a collection link with friends.",
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
    description:
      'Tell us your curator type (foodie, restaurant staff, cuisine expert), your city, and a short bio. You can also set a "Currently obsessed with" status that appears on your profile for 7 days — great for flagging a new find.',
  },
  {
    icon: <Camera size={22} />,
    title: "Post a dish — dish first, then where",
    description:
      "The 3-step wizard starts with the dish: name it, describe the taste, call out what makes it special at this specific spot, set the availability (all day / lunch / dinner / seasonal), and rate it. Step 2 picks the restaurant. Step 3 adds up to 4 photos and taste tags. At least one real photo is required.",
  },
  {
    icon: <MapPin size={22} />,
    title: "Your dish appears everywhere",
    description:
      "Recommendations show in the home feed, on the restaurant page, and on the map. Curators who post regularly earn expertise badges (Spicy Expert, Italian Specialist, and so on) visible on their profile.",
  },
  {
    icon: <BadgeCheck size={22} />,
    title: "Build your reputation",
    description:
      "Post consistently in a niche and followers will find you through the Following tab and curator search. Your profile shows total likes, saves, and views, and a taste profile card computed from your saved dishes.",
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

const faqs: { q: string; a: string }[] = [
  { q: "Is Dish Curator free?", a: "Yes — completely free for both browsers and curators." },
  {
    q: "Who are curators?",
    a: "Anyone who has personally tasted a dish and wants to share an honest recommendation. Foodies, chefs, restaurant staff, and everyday diners all qualify.",
  },
  {
    q: 'What is the "For you" tab?',
    a: "Once you are signed in and have saved at least a few dishes, the For you tab appears on the home feed. It analyses your saved dishes to find your top cuisine and most-saved tags, then surfaces similar dishes you have not seen yet.",
  },
  {
    q: "What are collections?",
    a: 'Collections are named dish lists you create under Saved → Lists — "Weekend ramen run", "Date night ideas", etc. You can add any saved dish to a list and share the collection link with friends. No sign-in required to view a shared collection.',
  },
  {
    q: "What is the Tried It diary?",
    a: "After saving a dish and eating it, switch to the Tried tab and mark it Loved it, Okay, or Would skip. It is a personal log, private to you, that helps you remember what you have tried.",
  },
  {
    q: "Why do you require a photo?",
    a: "A real photo of the actual dish sets expectations and builds trust. Stock images and screenshots from menus are not allowed.",
  },
  {
    q: "How do expertise badges work?",
    a: "After you post 2 or more recommendations that share a tag or cuisine, your curator profile automatically shows the relevant badge — like Spicy Expert or Italian Specialist.",
  },
  {
    q: "Can I edit or delete a recommendation?",
    a: "Editing is coming soon. For now, contact support if you need a post removed.",
  },
  {
    q: "Where are photos stored?",
    a: "Photos are uploaded to Supabase Storage (a secure cloud bucket) and linked to your recommendation. They are publicly viewable once posted.",
  },
  {
    q: 'What does "What makes this dish special here" mean?',
    a: 'It is an optional one-liner you fill in when posting — something specific to that restaurant\'s version: "House-made XO sauce, only at this branch" or "Chef Ryu\'s take uses brown butter instead of cream." It appears prominently on the dish detail page.',
  },
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
          <>
            <Link href="/" className="rounded-md bg-basil px-5 py-2.5 font-semibold text-white hover:bg-basil/90">
              Browse the feed
            </Link>
            <Link href="/explore" className="inline-flex items-center gap-2 rounded-md border border-black/15 px-5 py-2.5 font-semibold text-ink hover:bg-black/5">
              <Compass size={16} />Explore cuisines
            </Link>
            <Link href="/map" className="inline-flex items-center gap-2 rounded-md border border-black/15 px-5 py-2.5 font-semibold text-ink hover:bg-black/5">
              <MapPin size={16} />Open map
            </Link>
          </>
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

      {/* Quick feature reference */}
      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        {[
          { icon: <Search size={16} />, label: "Autocomplete search", desc: "Dish names, cuisines, and tags as you type" },
          { icon: <MapPin size={16} />, label: "Map discovery", desc: "Dishes in your area, filtered by viewport" },
          { icon: <Compass size={16} />, label: "Explore page", desc: "Cuisine heroes and tag pills → filtered feed" },
          { icon: <FolderOpen size={16} />, label: "Collections", desc: "Named dish lists you can share" },
          { icon: <BadgeCheck size={16} />, label: "Curator badges", desc: "Auto-earned expertise badges by cuisine/tag" },
          { icon: <Bookmark size={16} />, label: "Tried It diary", desc: "Personal log: Loved it / Okay / Would skip" },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 rounded-md border border-black/10 bg-white p-4 shadow-soft">
            <div className="mt-0.5 shrink-0 text-basil">{icon}</div>
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="mt-0.5 text-xs text-ink/60">{desc}</p>
            </div>
          </div>
        ))}
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
