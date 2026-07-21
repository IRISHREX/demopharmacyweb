import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/admin/careers")({
  component: AdminCareers,
});

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, "lowercase, digits and hyphens only"),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  employment_type: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  requirements: z.string().trim().max(5000).optional().or(z.literal("")),
  is_open: z.boolean(),
});
type Form = z.infer<typeof schema>;
type Row = {
  id: string;
  title: string;
  slug: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  requirements: string | null;
  is_open: boolean;
  posted_at: string;
};

const empty: Form = {
  title: "", slug: "", department: "", location: "", employment_type: "Full-time",
  description: "", requirements: "", is_open: true,
};

function AdminCareers() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin-careers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("job_vacancies").select("*").order("posted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);

  const upsert = useMutation({
    mutationFn: async (payload: Form & { id?: string }) => {
      const parsed = schema.parse(payload);
      const row = {
        title: parsed.title,
        slug: parsed.slug,
        department: parsed.department || null,
        location: parsed.location || null,
        employment_type: parsed.employment_type || null,
        description: parsed.description || null,
        requirements: parsed.requirements || null,
        is_open: parsed.is_open,
      };
      if (payload.id) {
        const { error } = await supabase.from("job_vacancies").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_vacancies").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Vacancy updated" : "Vacancy created");
      qc.invalidateQueries({ queryKey: ["admin-careers"] });
      qc.invalidateQueries({ queryKey: ["careers"] });
      setOpen(false); setEditingId(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_vacancies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-careers"] });
      qc.invalidateQueries({ queryKey: ["careers"] });
    },
  });

  const openNew = () => { setEditingId(null); setForm(empty); setOpen(true); };
  const openEdit = (r: Row) => {
    setEditingId(r.id);
    setForm({
      title: r.title, slug: r.slug,
      department: r.department ?? "", location: r.location ?? "",
      employment_type: r.employment_type ?? "", description: r.description ?? "",
      requirements: r.requirements ?? "", is_open: r.is_open,
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Careers</h1>
          <p className="text-sm text-muted-foreground">Post and manage job vacancies.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New vacancy</Button>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {list.data?.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.title}<div className="text-xs text-muted-foreground">{r.department}</div></td>
                <td className="px-4 py-3">{r.location ?? "—"}</td>
                <td className="px-4 py-3">{r.employment_type ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${r.is_open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {r.is_open ? "Open" : "Closed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-nowrap">
                  <button onClick={() => openEdit(r)} className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => confirm("Delete this vacancy?") && remove.mutate(r.id)} className="inline-flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No vacancies yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit vacancy" : "New vacancy"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="qc-analyst" />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Employment type</Label>
                <Input value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} placeholder="Full-time" />
              </div>
              <div className="flex items-end gap-3">
                <Switch checked={form.is_open} onCheckedChange={(v) => setForm({ ...form, is_open: v })} />
                <Label>{form.is_open ? "Open" : "Closed"}</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Requirements</Label>
              <Textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate(editingId ? { ...form, id: editingId } : form)} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
