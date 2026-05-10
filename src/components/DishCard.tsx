import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { DishFeedItem } from "@/lib/types";
import { LikeSaveButtons } from "./LikeSaveButtons";
import { ShareButton } from "./ShareButton";
import { computeDishScore } from "@/lib/dishScore";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function DishCard({ dish }: { dish: DishFeedItem }) {
  const isActiveCurator = dish.created_at
    ? Date.now() - new Date(dish.created_at).getTime() < SEVEN_DAYS_MS
    : false;

  const dishScore = dish.rating != null
    ? computeDishScore(dish.rating, dish.tags ?? [], dish.is_personally_tasted ?? false)
    : null;

  return (
    <article className="overflow-hidden rounded-md border border-black/10 bg-white shadow-soft">
      <Link href={`/dishes/${dish.id}`} className="block">
        <div className="relative aspect-[4/3] bg-black/5">
          {dish.image_url ? (
            <Image src={dish.image_url} alt={dish.dish_name} fill className="object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-ink/50">
              Dish photo coming soon
            </div>
          )}
        </div>
      </Link>
      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <Link href={`/dishes/${dish.id}`} className="hover:underline">
              <h2 className="text-xl font-semibold text-ink">{dish.dish_name}</h2>
            </Link>
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-saffron/15 px-2 py-1 text-sm font-semibold text-ink">
              <Star size={15} className="fill-saffron text-saffron" />
              {dishScore ?? "-"}
            </span>
          </div>
          {dish.restaurant_id ? (
            <Link href={`/restaurants/${dish.restaurant_id}`} className="mt-1 block font-medium text-basil hover:underline">
              {dish.restaurant_name ?? "Restaurant"}
            </Link>
          ) : (
            <p className="mt-1 font-medium text-basil">{dish.restaurant_name ?? "Restaurant"}</p>
          )}
          <p className="mt-1 flex items-center gap-1 text-sm text-ink/60">
            <MapPin size={14} />
            {[dish.restaurant_city, dish.cuisine].filter(Boolean).join(" • ") || "Location pending"}
            {dish.course_type ? ` · ${dish.course_type.replace(/_/g, " ")}` : ""}
          </p>
        </div>
        {dish.description ? <p className="text-sm leading-6 text-ink/75">{dish.description}</p> : null}
        <div className="flex flex-wrap gap-2">
          {dish.is_personally_tasted ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-basil/10 px-2 py-1 text-xs font-semibold text-basil">
              <BadgeCheck size={13} />
              Personally tasted
            </span>
          ) : null}
          {dish.is_vegetarian ? <span className="rounded-md bg-basil/10 px-2 py-1 text-xs font-semibold text-basil">Vegetarian</span> : null}
          {dish.tags?.map((tag) => (
            <span className="rounded-md bg-black/5 px-2 py-1 text-xs font-medium text-ink/70" key={tag}>
              {tag.replace(/_/g, " ")}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          {dish.curator_id ? (
            <Link href={`/curators/${dish.curator_id}`} className="min-w-0 text-sm text-ink/60 hover:underline">
              <span className="flex items-center gap-1.5">
                {isActiveCurator && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" title="Active this week" />
                )}
                <span className="truncate">{dish.curator_name ?? "a curator"}</span>
                {dish.curator_dish_count ? (
                  <span className="text-ink/40">· {dish.curator_dish_count} {dish.curator_dish_count === 1 ? "dish" : "dishes"}</span>
                ) : null}
              </span>
            </Link>
          ) : (
            <p className="text-sm text-ink/60">{dish.curator_name ?? "a curator"}</p>
          )}
          <div className="flex shrink-0 items-center">
            <ShareButton
              title={dish.dish_name}
              path={`/dishes/${dish.id}`}
              className="rounded p-1.5 text-ink/35 hover:bg-black/5 hover:text-ink/70"
            />
            <LikeSaveButtons
              dishId={dish.id}
              initialLikes={dish.like_count ?? 0}
              initialSaves={dish.save_count ?? 0}
              compact
            />
          </div>
        </div>
      </div>
    </article>
  );
}
