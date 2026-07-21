import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OtpGate, isPhoneVerified } from "@/components/site/otp-gate";

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

// Zaxia registered office
const OFFICE_ADDRESS = "127/24, Dhankal, Hatiara, Kolkata – 700157, West Bengal, India";
const MAPS_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(OFFICE_ADDRESS)}&output=embed`;
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(OFFICE_ADDRESS)}`;

const messageSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(200),
  message: z.string().trim().min(5, "Message is too short").max(4000),
});

function Contact() {
  const existing = typeof window !== "undefined" ? isPhoneVerified() : null;
  const initial = existing ? { name: existing.name ?? "", phone: existing.phone } : null;
  const [verified, setVerified] = useState<{ name: string; phone: string } | null>(initial);
  const [mapUnlocked, setMapUnlocked] = useState<boolean>(Boolean(initial));
  const [wantsMap, setWantsMap] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verified) return toast.error("Please verify your mobile number first.");
    const parsed = messageSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
    setSubmitting(true);
    const { error } = await supabase.from("inquiries").insert({
      name: verified.name || "Guest",
      email: parsed.data.email,
      phone: verified.phone,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) return toast.error("Could not send message. Please try again.");
    toast.success("Thanks! We'll be in touch shortly.");
    setForm({ email: "", message: "" });
  }

  return (
    <>
      <section className="gradient-brand text-primary-foreground rounded-b-2xl md:rounded-2xl md:m-1">
        <div className="container-page py-16 md:py-20 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground mt-16">Contact</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold gradient-heading">Let's talk healthcare.</h1>
          <p className="mt-4 text-lg text-primary-foreground">
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

          <div className="lg:col-span-3 space-y-8">
            {!verified ? (
              <OtpGate
                title="Verify to send an enquiry"
                description="Enter your name and mobile number — we'll send a one-time code via WhatsApp or SMS."
                onVerified={(d) => { setVerified(d); setMapUnlocked(true); }}
              />
            ) : (
              <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-border/60 bg-card p-8 md:p-10 shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Send an enquiry</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Verified as <span className="font-medium text-foreground">{verified.name}</span> · {verified.phone}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
                <div className="mt-8 grid gap-5">
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
            )}
          </div>
        </div>
      </section>

      {/* Google Map — gated by OTP */}
      <section className="pb-24">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold gradient-heading">Find us</h2>
              <p className="mt-1 text-sm text-muted-foreground">Our registered office in Kolkata.</p>
            </div>
            {mapUnlocked && (
              <a href={MAPS_LINK} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                Open in Google Maps ↗
              </a>
            )}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
            {mapUnlocked ? (
              <iframe
                title="Zaxia Healthcare office location"
                src={MAPS_EMBED_SRC}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-105 w-full border-0"
                allowFullScreen
              />
            ) : wantsMap ? (
              <div className="p-6 md:p-8">
                <OtpGate
                  title="Verify to view our location"
                  description="One-time mobile verification before we open Google Maps."
                  onVerified={(d) => { setVerified(d); setMapUnlocked(true); }}
                />
              </div>
            ) : (
              <div className="grid place-items-center gap-4 p-12 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-lg font-semibold">Map access is protected</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-md">
                    Verify your mobile number once to view our office location on Google Maps.
                  </p>
                </div>
                <button
                  onClick={() => setWantsMap(true)}
                  className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-95"
                >
                  <ShieldCheck className="h-4 w-4" /> Verify to view map
                </button>
              </div>
            )}
          </div>
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
