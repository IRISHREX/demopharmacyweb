import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import PageTransition from "@/components/ui/page-transition";
import LiveBackground from "@/components/ui/live-background";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeApplier } from "@/components/site/theme-applier";

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium tracking-widest text-primary uppercase">404</p>
          <h1 className="mt-3 text-4xl gradient-heading">Page not found</h1>
          <p className="mt-3 text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="btn inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="btn inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zaxia Healthcare — Trusted Pharmaceutical Solutions" },
      {
        name: "description",
        content:
          "Zaxia Healthcare Pvt. Ltd. delivers certified capsules, tablets, syrups and injections with 10+ years of expertise. Kolkata-based, serving India and beyond.",
      },
      { name: "author", content: "Zaxia Healthcare Pvt. Ltd." },
      { property: "og:title", content: "Zaxia Healthcare — Trusted Pharmaceutical Solutions" },
      {
        property: "og:description",
        content:
          "Zaxia Healthcare Pvt. Ltd. delivers certified capsules, tablets, syrups and injections with 10+ years of expertise. Kolkata-based, serving India and beyond.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Zaxia Healthcare — Trusted Pharmaceutical Solutions" },
      { name: "twitter:description", content: "Zaxia Healthcare Pvt. Ltd. delivers certified capsules, tablets, syrups and injections with 10+ years of expertise. Kolkata-based, serving India and beyond." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/499cafae-3186-4e97-b158-5c008abf5ab3" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/499cafae-3186-4e97-b158-5c008abf5ab3" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const isAbout = pathname === "/about";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <div className="min-h-screen relative overflow-hidden flex flex-col bg-background">
        <LiveBackground />
        <main className="relative z-10 flex-1">
          {!isAbout && <SiteHeader variant={isHome ? "hero" : "default"} />}
          <Outlet />
        </main>
        <SiteFooter />
        <PageTransition />
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

