import { createFileRoute, Link, Outlet, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Package, Inbox, Newspaper, LogOut, ExternalLink, Briefcase, Settings, BarChart3, ClipboardList, MessageCircleQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Zaxia Healthcare" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    
    // Server-side admin role check
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw redirect({ to: "/", replace: true });
    }
    
    return { user: data.user, isAdmin: true };
  },
  component: AdminLayout,
});

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/product-inquiries", label: "Product inquiries", icon: MessageCircleQuestion },
  { to: "/admin/careers", label: "Careers", icon: Briefcase },
  { to: "/admin/applications", label: "Applications", icon: ClipboardList },
  { to: "/admin/blog", label: "Blog", icon: Newspaper },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/settings", label: "Site settings", icon: Settings },
];

function AdminLayout() {
  const { user, isAdmin, adminChecked } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Client-side verification as secondary check (server-side is primary)
  useEffect(() => {
    if (adminChecked && user && !isAdmin) {
      toast.error("You don't have admin access.");
      navigate({ to: "/", replace: true });
    }
  }, [adminChecked, isAdmin, user, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!adminChecked) {
    return (
      <div className="container-page py-24 text-center text-sm text-muted-foreground">
        Verifying access…
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="container-page py-8 mt-16 grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-2xl border border-border/70 bg-card/80 p-4 h-fit lg:sticky lg:top-24">
        <div className="mb-4 px-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Signed in</p>
          <p className="mt-0.5 truncate text-sm font-medium">{user?.email}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as "/admin"}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-primary/10 text-primary font-medium" : "text-foreground/75 hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="my-3 h-px bg-border/70" />
        <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/75 hover:bg-muted">
          <ExternalLink className="h-4 w-4" /> View site
        </Link>
        <button
          onClick={signOut}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
