import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

function monthBuckets(): { key: string; label: string; from: string; to: string }[] {
  const out: { key: string; label: string; from: string; to: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      from: d.toISOString(),
      to: next.toISOString(),
    });
  }
  return out;
}

async function countByMonth(table: "page_visits" | "job_applications" | "blog_post_likes") {
  const buckets = monthBuckets();
  const rows = await Promise.all(
    buckets.map(async (b) => {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .gte("created_at", b.from)
        .lt("created_at", b.to);
      return { label: b.label, value: count ?? 0 };
    })
  );
  return rows;
}

function ChartCard({ title, data, kind = "line" }: { title: string; data: { label: string; value: number }[] | undefined; kind?: "line" | "bar" }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "line" ? (
            <LineChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdminReports() {
  const visits = useQuery({ queryKey: ["report", "visits"], queryFn: () => countByMonth("page_visits") });
  const apps = useQuery({ queryKey: ["report", "apps"], queryFn: () => countByMonth("job_applications") });
  const likes = useQuery({ queryKey: ["report", "likes"], queryFn: () => countByMonth("blog_post_likes") });

  const blogViews = useQuery({
    queryKey: ["report", "blogviews"],
    queryFn: async () => {
      const buckets = monthBuckets();
      return Promise.all(buckets.map(async (b) => {
        const { count } = await supabase
          .from("page_visits")
          .select("*", { count: "exact", head: true })
          .like("path", "/blog/%")
          .gte("created_at", b.from).lt("created_at", b.to);
        return { label: b.label, value: count ?? 0 };
      }));
    },
  });
  const productViews = useQuery({
    queryKey: ["report", "productviews"],
    queryFn: async () => {
      const buckets = monthBuckets();
      return Promise.all(buckets.map(async (b) => {
        const { count } = await supabase
          .from("page_visits")
          .select("*", { count: "exact", head: true })
          .eq("path", "/products")
          .gte("created_at", b.from).lt("created_at", b.to);
        return { label: b.label, value: count ?? 0 };
      }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl gradient-heading">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Trailing 12 months, monthly buckets.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Website visits" data={visits.data} />
        <ChartCard title="Job applications" data={apps.data} kind="bar" />
        <ChartCard title="Blog page views" data={blogViews.data} />
        <ChartCard title="Blog likes" data={likes.data} kind="bar" />
        <ChartCard title="Product page views" data={productViews.data} />
      </div>
    </div>
  );
}
