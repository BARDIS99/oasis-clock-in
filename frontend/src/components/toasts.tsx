import { useEffect, useState } from "react";
import { subscribeToasts, type Toast } from "@/lib/toast";

export function Toasts() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setItems), []);
  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={
            "pointer-events-auto rounded-md border px-4 py-3 text-sm shadow-card " +
            (t.kind === "ok"
              ? "border-ok/20 bg-ok-soft text-ok"
              : t.kind === "err"
                ? "border-danger/20 bg-danger-soft text-danger"
                : "border-line bg-surface text-ink")
          }
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
