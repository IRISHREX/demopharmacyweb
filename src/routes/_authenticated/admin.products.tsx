import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price_inr: z.number().nonnegative().nullable(),
  image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  category_id: z.string().uuid().nullable(),
  in_stock: z.boolean(),
  featured: z.boolean(),
});

type ProductForm = z.infer<typeof schema>;
type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_inr: number | null;
  image_url: string | null;
  category_id: string | null;
  in_stock: boolean;
  featured: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price_inr: null,
  image_url: "",
  category_id: null,
  in_stock: true,
  featured: false,
};

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, description, price_inr, image_url, category_id, in_stock, featured")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (values: ProductForm) => {
      const payload = {
        ...values,
        description: values.description || null,
        image_url: values.image_url || null,
      };
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price_inr: p.price_inr,
      image_url: p.image_url ?? "",
      category_id: p.category_id,
      in_stock: p.in_stock,
      featured: p.featured,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    save.mutate(parsed.data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Products</h1>
          <p className="mt-1 text-muted-foreground">Add, edit, and remove products from the catalog.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> New product
        </Button>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        {products.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.data?.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">{p.price_inr != null ? `₹${p.price_inr}` : "—"}</td>
                  <td className="px-4 py-3">{p.in_stock ? "In stock" : "Out"}</td>
                  <td className="px-4 py-3">{p.featured && <Star className="h-4 w-4 text-primary" />}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) remove.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {products.data?.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (INR)</Label>
                <Input id="price" type="number" step="0.01" value={form.price_inr ?? ""} onChange={(e) => setForm({ ...form, price_inr: e.target.value === "" ? null : Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat">Category</Label>
                <select
                  id="cat"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.category_id ?? ""}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
                >
                  <option value="">— none —</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" type="url" placeholder="https://…" value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch id="stock" checked={form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} />
                <Label htmlFor="stock">In stock</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="feat" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                <Label htmlFor="feat">Featured</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
