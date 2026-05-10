import { useRef, useState } from "react";

export type Toast = { msg: string; kind: "success" | "error" } | null;

export function useToast(durationMs = 2000) {
  const [toast, setToast] = useState<Toast>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, kind: "success" | "error" = "success") {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, kind });
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }

  return { toast, showToast };
}
