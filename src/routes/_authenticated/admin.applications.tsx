import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/applications")({
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
  component: AdminApplications,
});

type Row = {
  id: string;
  vacancy_id: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  answers: Record<string, string>;
  resume_url: string | null;
  status: string;
  created_at: string;
  job_vacancies: { title: string; slug: string } | null;
};

function AdminApplications() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("id, vacancy_id, applicant_name, applicant_phone, applicant_email, answers, resume_url, status, created_at, job_vacancies(title, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("job_applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-applications"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl gradient-heading">Job applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.data?.length ?? 0} total submissions
        </p>
      </div>
      <div className="space-y-3">
        {list.data?.map((r) => (
          <details key={r.id} className="rounded-2xl border border-border/70 bg-card p-4 open:shadow-soft">
            <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="font-medium">{r.applicant_name} <span className="text-muted-foreground">· {r.applicant_phone}</span></div>
                <div className="text-xs text-muted-foreground">
                  {r.job_vacancies?.title ?? "—"} · {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={r.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setStatus.mutate({ id: r.id, status: e.target.value })}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="new">New</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
                <button
                  onClick={(e) => { e.preventDefault(); if (confirm("Delete this application?")) remove.mutate(r.id); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </summary>
            <div className="mt-4 grid gap-2 text-sm">
              {r.applicant_email && <div><span className="text-muted-foreground">Email:</span> {r.applicant_email}</div>}
              {r.resume_url && (
                <div>
                  <a href={r.resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    Resume <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
              {Object.entries(r.answers ?? {}).filter(([k]) => k !== "__email").map(([k, v]) => (
                <div key={k} className="rounded-md bg-muted/50 p-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                  <div className="whitespace-pre-wrap">{String(v)}</div>
                </div>
              ))}
            </div>
          </details>
        ))}
        {list.data && list.data.length === 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
            No applications yet.
          </div>
        )}
      </div>
    </div>
  );
}
