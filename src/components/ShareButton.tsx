"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text?: string;
  path: string;
  className?: string;
  label?: string;
}

export function ShareButton({ title, text, path, className, label }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled — no-op
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard not available
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className}
      title={copied ? "Link copied!" : (label ?? "Share")}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {label ? <span>{copied ? "Copied!" : label}</span> : null}
    </button>
  );
}
