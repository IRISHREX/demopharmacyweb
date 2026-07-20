import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";

function hexToHsl(hex: string): string | null {
  const m = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getReadableForegound(hex: string): string {
  const m = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return "oklch(0.99 0.005 240)";
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "oklch(0.15 0.03 255)" : "oklch(0.99 0.005 240)";
}

export function ThemeApplier() {
  const { data } = useSiteSettings();
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const mode = data?.theme?.mode ?? "light";
    root.classList.toggle("dark", mode === "dark");
    const primary = data?.theme?.primary;
    if (primary) {
      const hsl = hexToHsl(primary);
      if (hsl) {
        root.style.setProperty("--primary", `hsl(${hsl})`);
        root.style.setProperty("--primary-foreground", getReadableForegound(primary));
        root.style.setProperty("--ring", `hsl(${hsl})`);
      } else {
        root.style.setProperty("--primary", primary);
        root.style.setProperty("--primary-foreground", getReadableForegound(primary));
      }
    }
  }, [data?.theme?.mode, data?.theme?.primary]);
  return null;
}
