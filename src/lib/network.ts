import { useEffect, useState } from "react";

type Connection = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  addEventListener?: (t: string, cb: () => void) => void;
  removeEventListener?: (t: string, cb: () => void) => void;
};

function getConn(): Connection | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as unknown as { connection?: Connection; mozConnection?: Connection; webkitConnection?: Connection };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

/** Returns true when connection is fast enough to render heavy media (videos, 3D). */
export function useCanRenderHeavyMedia(): boolean {
  const [ok, setOk] = useState<boolean>(() => {
    const c = getConn();
    if (!c) return true; // no info: default to allow
    if (c.saveData) return false;
    if (c.effectiveType && ["slow-2g", "2g", "3g"].includes(c.effectiveType)) return false;
    if (typeof c.downlink === "number" && c.downlink < 1.5) return false;
    return true;
  });
  useEffect(() => {
    const c = getConn();
    if (!c?.addEventListener) return;
    const update = () => {
      const slow =
        c.saveData ||
        (c.effectiveType && ["slow-2g", "2g", "3g"].includes(c.effectiveType)) ||
        (typeof c.downlink === "number" && c.downlink < 1.5);
      setOk(!slow);
    };
    c.addEventListener("change", update);
    return () => c.removeEventListener?.("change", update);
  }, []);
  return ok;
}
