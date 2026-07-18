import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact Zaxia Healthcare" },
      { name: "description", content: "Get in touch with Zaxia Healthcare Pvt. Ltd. Kolkata office, phone, email and enquiry form." },
      { property: "og:title", content: "Contact Zaxia Healthcare" },
      { property: "og:description", content: "Reach our team for product enquiries, distributor partnerships or clinical support." },
    ],
  }),
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message is too short").max(4000),
});

function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("inquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send message. Please try again.");
      return;
    }
    toast.success("Thanks! We'll be in touch shortly.");
    setForm({ name: "", email: "", phone: "", message: "" });
  }

  return (
    <>
      <section className="gradient-hero">
        <div className="container-page py-16 md:py-20 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold gradient-heading">Let's talk healthcare.</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Distributor enquiries, product information, clinician partnerships — our team
            replies within one business day.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <ContactCard icon={MapPin} title="Registered Office">
              127/24, Dhankal, Hatiara,<br />
              Kolkata – 700157, West Bengal, India
            </ContactCard>
            <ContactCard icon={Phone} title="Phone">
              <a href="tel:+918017190377" className="block hover:text-primary">80171-90377</a>
              <a href="tel:+917585832008" className="block hover:text-primary">75858-32008</a>
            </ContactCard>
            <ContactCard icon={Mail} title="Email">
              <a href="mailto:zaxiahealthcare@gmail.com" className="hover:text-primary break-all">
                zaxiahealthcare@gmail.com
              </a>
            </ContactCard>
            <p className="text-xs text-muted-foreground pt-2">Registered with RoC-Kolkata</p>
          </div>

          <form
            onSubmit={onSubmit}
            className="lg:col-span-3 rounded-2xl border border-border/60 bg-card p-8 md:p-10 shadow-soft"
          >
            <h2 className="text-2xl font-semibold">Send an enquiry</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in the form and we'll get back to you shortly.
            </p>
            <div className="mt-8 grid gap-5">
              <Field label="Full name" required>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={120}
                  className="input-base"
                  placeholder="Dr. Priya Sharma"
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    maxLength={200}
                    className="input-base"
                    placeholder="you@example.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={40}
                    className="input-base"
                    placeholder="+91 …"
                  />
                </Field>
              </div>
              <Field label="Message" required>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  maxLength={4000}
                  rows={5}
                  className="input-base resize-none"
                  placeholder="Tell us about your enquiry…"
                />
              </Field>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? "Sending…" : <>Send message <Send className="h-4 w-4" /></>}
              </button>
            </div>
          </form>
        </div>
      </section>

      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-background);
          padding: 0.65rem 0.85rem;
          font-size: 0.9rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input-base:focus {
          border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 25%, transparent);
        }
      `}</style>
    </>
  );
}

function ContactCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-ink">{title}</h3>
          <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-brand-ink">
        {label} {required && <span className="text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}
