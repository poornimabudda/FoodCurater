"use client";

import { useRef } from "react";
import { ImagePlus, Star, X } from "lucide-react";

export type ImagePreview = {
  id: string;
  file: File;
  previewUrl: string;
  error?: string;
};

const MAX_IMAGES = 4;
const MIN_PX = 600;
const MAX_PX = 1500;
const JPEG_QUALITY = 0.82;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function compressImage(file: File): Promise<{ file: File; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error("Use a JPG, PNG, or WebP photo."));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: ow, naturalHeight: oh } = img;
      if (ow < MIN_PX || oh < MIN_PX) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Photo too small (${ow}×${oh}px). Use a higher-res shot.`));
        return;
      }
      let w = ow, h = oh;
      if (w > MAX_PX || h > MAX_PX) {
        if (w >= h) { h = Math.round(h * MAX_PX / w); w = MAX_PX; }
        else { w = Math.round(w * MAX_PX / h); h = MAX_PX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error("Canvas unavailable.")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Compression failed.")); return; }
        const baseName = file.name.replace(/\.[^.]+$/, "");
        const compressed = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
        resolve({ file: compressed, previewUrl: URL.createObjectURL(compressed) });
      }, "image/jpeg", JPEG_QUALITY);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read image.")); };
    img.src = objectUrl;
  });
}

type Props = {
  images: ImagePreview[];
  onChange: (images: ImagePreview[]) => void;
};

export function ImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    const results: ImagePreview[] = [];
    for (const file of toProcess) {
      const id = `${Date.now()}-${Math.random()}`;
      try {
        const { file: compressed, previewUrl } = await compressImage(file);
        results.push({ id, file: compressed, previewUrl });
      } catch (err) {
        results.push({ id, file, previewUrl: URL.createObjectURL(file), error: err instanceof Error ? err.message : "Invalid image." });
      }
    }
    onChange([...images, ...results]);
  }

  function remove(id: string) {
    const img = images.find((i) => i.id === id);
    if (img) URL.revokeObjectURL(img.previewUrl);
    onChange(images.filter((i) => i.id !== id));
  }

  function makePrimary(id: string) {
    const idx = images.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const next = [...images];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    onChange(next);
  }

  const canAdd = images.length < MAX_IMAGES;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dish photos</h2>
        <span className="text-xs text-ink/40">{images.length}/{MAX_IMAGES} · first photo = feed card</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div key={img.id} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md border border-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.previewUrl} alt="preview" className="h-full w-full object-cover" />
            {img.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-1 text-center text-[10px] leading-tight text-white">
                {img.error}
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(img.id)}
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white hover:bg-black"
              aria-label="Remove photo"
            >
              <X size={11} />
            </button>
            {idx === 0 ? (
              <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-saffron px-1.5 py-0.5 text-[10px] font-semibold text-white">
                <Star size={9} />Primary
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makePrimary(img.id)}
                className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-black/80"
              >
                Make primary
              </button>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-black/20 text-ink/40 hover:border-basil/50 hover:text-basil"
          >
            <ImagePlus size={22} />
            <span className="text-xs font-medium">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <details className="group rounded-md border border-black/10 bg-black/[0.02]">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-ink/60 marker:content-[''] group-open:text-ink">
          Tips for great dish photos
        </summary>
        <ul className="space-y-1.5 px-4 pb-4 pt-1 text-sm text-ink/60">
          <li>· Natural light or bright indoor light — avoid flash glare</li>
          <li>· Fill the frame with the dish, not the table</li>
          <li>· Tap to focus before shooting for sharpness</li>
          <li>· Show the texture: crispy edges, sauce, steam if fresh</li>
          <li>· No screenshots from other apps or menus</li>
        </ul>
      </details>
    </div>
  );
}
