import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, type SiteSettings } from "@/hooks/use-site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/site/media-upload";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Form = {
  site_name: string;
  tagline: string;
  logo_url: string;
  address: string;
  phone: string;
  email: string;
  google_maps_url: string;
  latitude: string;
  longitude: string;
  theme_mode: "light" | "dark";
  theme_primary: string;
  quote_text: string;
  quote_author: string;
};

const fromSettings = (s: SiteSettings | null | undefined): Form => ({
  site_name: s?.site_name ?? "",
  tagline: s?.tagline ?? "",
  logo_url: s?.logo_url ?? "",
  address: s?.address ?? "",
  phone: s?.phone ?? "",
  email: s?.email ?? "",
  google_maps_url: s?.google_maps_url ?? "",
  latitude: s?.latitude?.toString() ?? "",
  longitude: s?.longitude?.toString() ?? "",
  theme_mode: (s?.theme?.mode as "light" | "dark") ?? "light",
  theme_primary: s?.theme?.primary ?? "#0b6bcb",
  quote_text: s?.quote_text ?? "",
  quote_author: s?.quote_author ?? "",
});

function AdminSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useSiteSettings();
  const [form, setForm] = useState<Form>(fromSettings(data));

  useEffect(() => {
    if (data) setForm(fromSettings(data));
  }, [data?.id]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data?.id) throw new Error("Settings row missing");
      const payload = {
        site_name: form.site_name,
        tagline: form.tagline || null,
        logo_url: form.logo_url || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        google_maps_url: form.google_maps_url || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        theme: { mode: form.theme_mode, primary: form.theme_primary },
        quote_text: form.quote_text || null,
        quote_author: form.quote_author || null,
      };
      const { error } = await supabase.from("site_settings").update(payload).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl gradient-heading">Site settings</h1>
        <p className="mt-1 text-muted-foreground">Branding, contact, theme, and quote of the day.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-8"
      >
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-6">
          <h2 className="text-lg font-medium">Branding</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Site name</Label>
              <Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <MediaUpload
              value={form.logo_url || null}
              onChange={(url) => setForm({ ...form, logo_url: url ?? "" })}
              folder="branding"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-6">
          <h2 className="text-lg font-medium">Contact & location</h2>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Google Maps embed URL</Label>
            <Input
              value={form.google_maps_url}
              onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
              placeholder="https://www.google.com/maps/embed?…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-6">
          <h2 className="text-lg font-medium">Theme</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.theme_mode}
                onChange={(e) => setForm({ ...form, theme_mode: e.target.value as "light" | "dark" })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Primary color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.theme_primary}
                  onChange={(e) => setForm({ ...form, theme_primary: e.target.value })}
                  className="h-10 w-14 rounded border border-input"
                />
                <Input value={form.theme_primary} onChange={(e) => setForm({ ...form, theme_primary: e.target.value })} />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-6">
          <h2 className="text-lg font-medium">Quote of the day</h2>
          <div className="space-y-1.5">
            <Label>Quote</Label>
            <Textarea rows={2} value={form.quote_text} onChange={(e) => setForm({ ...form, quote_text: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Author</Label>
            <Input value={form.quote_author} onChange={(e) => setForm({ ...form, quote_author: e.target.value })} />
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
