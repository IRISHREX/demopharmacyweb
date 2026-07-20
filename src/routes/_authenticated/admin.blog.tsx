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
import { MediaUpload, detectMediaKind } from "@/components/site/media-upload";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlog,
});

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().max(400).optional().or(z.literal("")),
  content: z.string().trim().max(20000).optional().or(z.literal("")),
  image_url: z.string().trim().max(500).optional().or(z.literal("")),
  published: z.boolean(),
});
type Form = z.infer<typeof schema>;
type Row = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  published_at: string | null;
};

const empty: Form = { title: "", slug: "", excerpt: "", content: "", image_url: "", published: false };

function AdminBlog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Form>(empty);

  const posts = useQuery({
    queryKey: ["admin", "blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, content, image_url, published_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const save = useMutation({
    mutationFn: async (v: Form) => {
      const payload = {
        title: v.title,
        slug: v.slug,
        excerpt: v.excerpt || null,
        content: v.content || null,
        image_url: v.image_url || null,
        published_at: v.published ? new Date().toISOString() : null,
      };
      if (editing) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Post updated" : "Post created");
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      setOpen(false);
      setEditing(null);
      setForm(empty);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt ?? "",
      content: r.content ?? "",
      image_url: r.image_url ?? "",
      published: !!r.published_at,
    });
    setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid");
    save.mutate(parsed.data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl gradient-heading">Blog</h1>
          <p className="mt-1 text-muted-foreground">Publish articles and product updates.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> New post</Button>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        {posts.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {posts.data?.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3"><p className="font-medium">{p.title}</p><p className="text-xs text-muted-foreground">/{p.slug}</p></td>
                  <td className="px-4 py-3">{p.published_at ? <span className="text-primary">Published</span> : <span className="text-muted-foreground">Draft</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Delete "${p.title}"?`)) remove.mutate(p.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {posts.data?.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">No posts yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit post" : "New post"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="title">Title</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" rows={2} value={form.excerpt ?? ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="content">Content</Label>
              <Textarea id="content" rows={8} value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="image">Cover image URL</Label>
              <Input id="image" type="url" value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Switch id="pub" checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label htmlFor="pub">Published</Label>
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
