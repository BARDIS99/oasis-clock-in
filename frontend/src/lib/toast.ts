type ToastKind = "ok" | "err" | "info";
type Toast = { id: number; kind: ToastKind; text: string };

let seq = 1;
const listeners = new Set<(items: Toast[]) => void>();
let items: Toast[] = [];

function emit() {
  for (const l of listeners) l(items);
}

export function pushToast(kind: ToastKind, text: string) {
  const id = seq++;
  items = [...items, { id, kind, text }].slice(-3);
  emit();
  window.setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 3800);
}

export function subscribeToasts(fn: (items: Toast[]) => void) {
  listeners.add(fn);
  fn(items);
  return () => {
    listeners.delete(fn);
  };
}

export type { Toast };
