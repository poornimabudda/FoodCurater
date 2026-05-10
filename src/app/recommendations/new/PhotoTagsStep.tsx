"use client";

import { ImageUploader, type ImagePreview } from "@/components/ImageUploader";
import { tagGroups } from "@/lib/constants";

type Props = {
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  uploadImages: ImagePreview[];
  setUploadImages: (imgs: ImagePreview[]) => void;
};

export function PhotoTagsStep({ selectedTags, toggleTag, uploadImages, setUploadImages }: Props) {
  return (
    <div className="grid gap-6">
      <ImageUploader images={uploadImages} onChange={setUploadImages} />
      <div>
        <p className="mb-3 text-sm font-semibold text-ink">
          Tags <span className="font-normal text-ink/50">(optional)</span>
        </p>
        {tagGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                    selectedTags.includes(tag) ? "bg-basil text-white" : "bg-black/5 text-ink"
                  }`}
                >
                  {tag.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
