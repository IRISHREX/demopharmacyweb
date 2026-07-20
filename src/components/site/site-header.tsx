import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import logoImg from "@/assets/Zaxia_Logo.png";
import { useSiteSettings } from "@/hooks/use-site-settings";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/careers", label: "Careers" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader({ variant = "default" }: { variant?: "default" | "hero" }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();

  return (
    <header
      className={cn(
        "z-40 rounded-full border",
        variant === "hero"
          ? "absolute inset-x-0 top-3 mx-auto w-full max-w-[76rem] bg-white/100 shadow-soft"
          : "sticky top-0 w-[80%] mx-auto bg-background/85 shadow-lg",
      )}
    >
      <div className={cn("container-page flex h-16 items-center justify-between", variant === "hero" ? "px-3" : "")}>
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Zaxia Healthcare logo"
            className="h-20 w-20 rounded-2xl object-contain "
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1 ">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3.5 py-2 text-sm font-medium rounded-full transition-colors",
                  active
                    ? "text-primary bg-primary/8"
                    : "text-foreground/75 hover:text-primary hover:bg-primary/5",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="btn inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/40"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <Link
            to="/contact"
            className="btn inline-flex items-center rounded-full gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft border-0 border-border/100 hover:opacity-95 hover:border-2"
          >
            Enquire now
          </Link>
        </div>

        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container-page py-3 flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-3 py-2.5 text-sm font-medium rounded-full",
                  pathname === item.to
                    ? "text-primary bg-primary/8"
                    : "text-foreground/80 hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="btn mt-2 inline-flex items-center justify-center rounded-full gradient-brand px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Enquire now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
