import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/visitor";

export function VisitTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const last = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return;
    if (last.current === pathname) return;
    last.current = pathname;
    supabase.from("page_visits").insert({
      path: pathname,
      visitor_id: getVisitorId(),
      referrer: document.referrer || null,
    }).then(() => {});
  }, [pathname]);

  return null;
}
