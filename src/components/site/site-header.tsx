import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import logoImg from "@/assets/Zaxia_Logo.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Zaxia Healthcare logo"
            className="h-20 w-20 rounded-2xl border border-white/10 bg-white/10 object-contain shadow-soft"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3.5 py-2 text-sm font-medium rounded-md transition-colors",
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
              className="btn inline-flex items-center gap-1.5 rounded-md border border-border/70 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/40"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <Link
            to="/contact"
            className="btn inline-flex items-center rounded-md gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-95"
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
                  "px-3 py-2.5 text-sm font-medium rounded-md",
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
              className="btn mt-2 inline-flex items-center justify-center rounded-md gradient-brand px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Enquire now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
