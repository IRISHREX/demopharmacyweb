import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OtpGate, isPhoneVerified } from "@/components/site/otp-gate";
import { MediaUpload } from "@/components/site/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/careers_/$slug/apply")({
  component: ApplyPage,
});

type Vacancy = { id: string; slug: string; title: string };
type Field = {
  id: string;
  label: string;
  field_type: "text" | "textarea" | "email" | "tel" | "select" | "file";
  options: string[] | null;
  required: boolean;
  order_index: number;
};

function ApplyPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(isPhoneVerified());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  const vacancy = useQuery({
    queryKey: ["vacancy-apply", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_vacancies")
        .select("id, slug, title")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Vacancy | null;
    },
  });

  const fields = useQuery({
    queryKey: ["vacancy-fields", vacancy.data?.id],
    enabled: !!vacancy.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_application_fields")
        .select("id, label, field_type, options, required, order_index")
        .eq("vacancy_id", vacancy.data!.id)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as Field[];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!vacancy.data || !verified) throw new Error("Verify mobile first");
      for (const f of fields.data ?? []) {
        if (f.required && !answers[f.id]?.trim()) throw new Error(`"${f.label}" is required`);
      }
      const { error } = await supabase.from("job_applications").insert({
        vacancy_id: vacancy.data.id,
        applicant_name: verified.name || "Applicant",
        applicant_phone: verified.phone,
        applicant_email: answers.__email || null,
        answers,
        resume_url: resumeUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted");
      navigate({ to: "/careers" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (vacancy.isLoading) return <div className="container-page py-24 text-sm text-muted-foreground">Loading…</div>;
  if (!vacancy.data) return <div className="container-page py-24">Vacancy not found. <Link to="/careers" className="text-primary">Back</Link></div>;

  return (
    <div className="container-page py-16 mt-16 max-w-2xl">
      <Link to="/careers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All openings
      </Link>
      <h1 className="mt-4 text-3xl gradient-heading">Apply · {vacancy.data.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Verify your mobile, then fill in the details below.</p>

      <div className="mt-8">
        {!verified ? (
          <OtpGate
            title="Verify your mobile to apply"
            description="One-time verification protects the application form from spam."
            onVerified={(v) => setVerified(v)}
          />
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
            className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <div className="rounded-lg bg-primary/8 px-3 py-2 text-xs text-primary">
              Verified: <strong>{verified.name}</strong> · {verified.phone}
            </div>

            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                value={answers.__email ?? ""}
                onChange={(e) => setAnswers({ ...answers, __email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            {(fields.data ?? []).map((f) => (
              <div key={f.id} className="space-y-1.5">
                <Label>
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </Label>
                {f.field_type === "textarea" ? (
                  <Textarea
                    rows={3}
                    required={f.required}
                    value={answers[f.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
                  />
                ) : f.field_type === "select" ? (
                  <select
                    required={f.required}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={answers[f.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.field_type === "file" ? (
                  <MediaUpload
                    value={answers[f.id] || null}
                    onChange={(url) => setAnswers({ ...answers, [f.id]: url ?? "" })}
                    folder="applications"
                  />
                ) : (
                  <Input
                    type={f.field_type === "email" ? "email" : f.field_type === "tel" ? "tel" : "text"}
                    required={f.required}
                    value={answers[f.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
                  />
                )}
              </div>
            ))}

            {(fields.data ?? []).find((f) => f.field_type === "file") ? null : (
              <div className="space-y-1.5">
                <Label>Resume / CV (optional)</Label>
                <MediaUpload value={resumeUrl} onChange={(url) => setResumeUrl(url)} folder="applications" />
              </div>
            )}

            <Button type="submit" disabled={submit.isPending} className="w-full">
              {submit.isPending ? "Submitting…" : "Submit application"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
