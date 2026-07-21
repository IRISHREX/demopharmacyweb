export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  const KEY = "zaxia_visitor_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(KEY, id);
  }
  return id;
}
