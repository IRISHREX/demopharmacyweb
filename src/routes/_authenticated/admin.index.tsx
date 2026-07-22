import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Inbox, Newspaper, Eye, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
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
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const products = useQuery({
    queryKey: ["admin", "count", "products"],
    queryFn: async () => {
      const { count, error } = await supabase.from("products").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
  const inquiries = useQuery({
    queryKey: ["admin", "count", "inquiries"],
    queryFn: async () => {
      const { count, error } = await supabase.from("inquiries").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
  const posts = useQuery({
    queryKey: ["admin", "count", "posts"],
    queryFn: async () => {
      const { count, error } = await supabase.from("blog_posts").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
  const visits = useQuery({
    queryKey: ["admin", "count", "visits"],
    queryFn: async () => {
      const { count, error } = await supabase.from("page_visits").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
  const visits7d = useQuery({
    queryKey: ["admin", "count", "visits", "7d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("page_visits")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);
      if (error) throw error;
      return count ?? 0;
    },
  });
  const recent = useQuery({
    queryKey: ["admin", "inquiries", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id, name, email, message, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const cards = [
    { label: "Total visits", value: visits.data, icon: Eye },
    { label: "Visits · 7 days", value: visits7d.data, icon: Users },
    { label: "Products", value: products.data, icon: Package },
    { label: "Blog posts", value: posts.data, icon: Newspaper },
    { label: "Inquiries", value: inquiries.data, icon: Inbox },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl gradient-heading">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your Zaxia Healthcare site.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl text-brand-ink">{c.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl">Recent inquiries</h2>
        <div className="mt-3 rounded-2xl border border-border/70 bg-card overflow-hidden">
          {recent.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : recent.data && recent.data.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {recent.data.map((i) => (
                <li key={i.id} className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">{i.name} <span className="text-muted-foreground">· {i.email}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{i.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">No inquiries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
