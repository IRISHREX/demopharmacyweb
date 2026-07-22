import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
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
  component: AdminInquiries,
});

function AdminInquiries() {
  const qc = useQueryClient();
  const inquiries = useQuery({
    queryKey: ["admin", "inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id, name, email, phone, message, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inquiry deleted");
      qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      qc.invalidateQueries({ queryKey: ["admin", "count", "inquiries"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl gradient-heading">Inquiries</h1>
        <p className="mt-1 text-muted-foreground">Messages submitted through the contact form.</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        {inquiries.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : inquiries.data && inquiries.data.length > 0 ? (
          <ul className="divide-y divide-border/60">
            {inquiries.data.map((i) => (
              <li key={i.id} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <a href={`mailto:${i.email}`} className="hover:text-primary">{i.email}</a>
                      {i.phone ? ` · ${i.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this inquiry?")) remove.mutate(i.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{i.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-sm text-muted-foreground">No inquiries yet.</div>
        )}
      </div>
    </div>
  );
}
