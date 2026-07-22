import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/product-inquiries")({
  component: AdminProductInquiries,
});

type Row = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  question: string;
  resolved: boolean;
  created_at: string;
  products: { name: string } | null;
};

function AdminProductInquiries() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin-product-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_inquiries")
        .select("id, name, phone, email, question, resolved, created_at, products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (r: Row) => {
      const { error } = await supabase.from("product_inquiries").update({ resolved: !r.resolved }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-product-inquiries"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_inquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-product-inquiries"] });
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl gradient-heading">Product inquiries</h1>
        <p className="mt-1 text-sm text-muted-foreground">Questions submitted from the product catalog.</p>
      </div>
      <div className="space-y-3">
        {list.data?.map((r) => (
          <div key={r.id} className={`rounded-2xl border p-4 ${r.resolved ? "border-border/40 bg-muted/30 opacity-70" : "border-border/70 bg-card"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-primary">{r.products?.name ?? "—"}</div>
                <div className="mt-1 font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.phone && <>📞 {r.phone} · </>}{r.email && <>✉ {r.email} · </>}
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggle.mutate(r)} className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-primary/10 text-primary" title={r.resolved ? "Mark unresolved" : "Mark resolved"}>
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => confirm("Delete?") && remove.mutate(r.id)} className="inline-flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{r.question}</p>
          </div>
        ))}
        {list.data && list.data.length === 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
            No product inquiries yet.
          </div>
        )}
      </div>
    </div>
  );
}
