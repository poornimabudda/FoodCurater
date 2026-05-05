import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, ChefHat, HelpCircle, PlusCircle } from "lucide-react";
import { NavAuth } from "@/components/NavAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dish Curator",
  description: "Dish-level food recommendations from trusted curators."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-black/10 bg-rice/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link className="flex items-center gap-2 text-lg font-semibold text-ink" href="/">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-basil text-white">
                <ChefHat size={20} />
              </span>
              Dish Curator
            </Link>
            <nav className="flex items-center gap-2">
              <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-black/5" href="/how-it-works">
                <span className="flex items-center gap-1.5">
                  <HelpCircle size={16} />
                  <span className="hidden sm:inline">How it works</span>
                </span>
              </Link>
              <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-black/5" href="/saved">
                <span className="flex items-center gap-1.5">
                  <Bookmark size={16} />
                  <span className="hidden sm:inline">Saved</span>
                </span>
              </Link>
              {/* NavAuth shows: display name + sign-out when logged in, or Sign in link */}
              <NavAuth />
              <Link className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-black" href="/recommendations/new">
                <span className="flex items-center gap-1.5">
                  <PlusCircle size={16} />
                  <span className="hidden sm:inline">Recommend</span>
                </span>
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
