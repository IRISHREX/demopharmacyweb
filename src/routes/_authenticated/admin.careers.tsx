import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, ListChecks } from "lucide-react";
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
  const [fieldsFor, setFieldsFor] = useState<Row | null>(null);

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
                  <button onClick={() => setFieldsFor(r)} className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted" title="Manage form fields"><ListChecks className="h-4 w-4" /></button>
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

      <FieldsDialog vacancy={fieldsFor} onClose={() => setFieldsFor(null)} />
    </div>
  );
}

type FieldRow = {
  id: string;
  vacancy_id: string;
  label: string;
  field_type: "text" | "textarea" | "email" | "tel" | "select" | "file";
  options: string[] | null;
  required: boolean;
  order_index: number;
};

function FieldsDialog({ vacancy, onClose }: { vacancy: Row | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldRow["field_type"]>("text");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");

  const list = useQuery({
    queryKey: ["job-fields", vacancy?.id],
    enabled: !!vacancy,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_application_fields")
        .select("*")
        .eq("vacancy_id", vacancy!.id)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as FieldRow[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!vacancy || !label.trim()) return;
      const next = (list.data?.length ?? 0) + 1;
      const { error } = await supabase.from("job_application_fields").insert({
        vacancy_id: vacancy.id,
        label: label.trim(),
        field_type: type,
        required,
        options: type === "select" ? options.split(",").map((o) => o.trim()).filter(Boolean) : null,
        order_index: next,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Field added");
      setLabel(""); setOptions(""); setRequired(false); setType("text");
      qc.invalidateQueries({ queryKey: ["job-fields", vacancy?.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_application_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-fields", vacancy?.id] }),
  });

  return (
    <Dialog open={!!vacancy} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Form fields · {vacancy?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Question / Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Years of experience" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as FieldRow["field_type"])}
                >
                  <option value="text">Short text</option>
                  <option value="textarea">Long text</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="select">Dropdown</option>
                  <option value="file">File upload</option>
                </select>
              </div>
            </div>
            {type === "select" && (
              <div className="space-y-1.5">
                <Label>Options (comma-separated)</Label>
                <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="0-1, 1-3, 3-5, 5+" />
              </div>
            )}
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Required field
            </label>
            <div>
              <Button onClick={() => add.mutate()} disabled={add.isPending || !label.trim()} size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add field
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {list.data?.map((f, i) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i + 1}. {f.label} {f.required && <span className="text-destructive">*</span>}</div>
                  <div className="text-xs text-muted-foreground">{f.field_type}{f.options?.length ? ` · ${f.options.join(", ")}` : ""}</div>
                </div>
                <button onClick={() => del.mutate(f.id)} className="inline-flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {list.data && list.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No custom fields yet. Applicants will only submit name, phone and email.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

