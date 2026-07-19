import { createFileRoute } from "@tanstack/react-router";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteHeader } from "@/components/site/site-header";
import { Users, FlaskConical, HeartPulse, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import aboutImg from "@/assets/about-lab.jpg";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About Zaxia Healthcare — Our mission & team" },
      { name: "description", content: "Learn about Zaxia Healthcare Pvt. Ltd. — our mission, 10+ years of pharmaceutical experience, and the team behind our trusted formulations." },
      { property: "og:title", content: "About Zaxia Healthcare" },
      { property: "og:description", content: "A pharmaceutical marketing and trading company committed to accessible, high-quality healthcare." },
    ],
  }),
});

function About() {
  return (
    <>
      <section className="gradient-hero pt-3">
        <SiteHeader variant="default" />
        <div className="container-page py-20 md:py-28">
          <div className="max-w-3xl mt-8 md:mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">About Us</p>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight gradient-heading">
              Healthcare, engineered around <span className="italic text-primary">trust.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Zaxia Healthcare Pvt. Ltd. is a pharmaceutical marketing and trading company
              based in Kolkata, India. For over a decade we've been committed to accessible,
              high-quality healthcare solutions — grounded in innovation and patient-centered care.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page grid gap-14 rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-2 lg:items-center lg:p-12">
          <div>
            <SectionHeading
              eyebrow="Our mission"
              title="Making quality medicine reach every hand that needs it."
              description="We believe healthcare is a right, not a privilege. Every formulation we bring to market is chosen for its clinical value, safety, and the difference it can make in a patient's day. Our teams work directly with clinicians and distributors so critical medicines are never out of reach."
            />
          </div>
          <img
            src={aboutImg}
            alt="Pharmaceutical research facility"
            width={1400}
            height={1000}
            loading="lazy"
            className="rounded-2xl shadow-soft w-full h-auto object-cover aspect-[4/3]"
          />
        </div>
      </section>

      <section className="py-24 bg-surface">
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow="Our journey"
            title="A decade of pharmaceutical craftsmanship."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { year: "2014", title: "Founded in Kolkata", body: "Zaxia Healthcare established with a mission to bring certified formulations to underserved markets." },
              { year: "2018", title: "Expanded product range", body: "Broadened our catalog to cover gastro, pain management, nutrition, respiratory and IV therapies." },
              { year: "2024", title: "Nationwide network", body: "Trusted by hundreds of clinics and distributors across India, with 24/7 emergency access." },
            ].map((m) => (
              <div key={m.year} className="rounded-2xl border border-border/60 bg-card p-8">
                <p className="font-display text-3xl font-semibold text-primary">{m.year}</p>
                <h3 className="mt-3 text-lg font-semibold text-brand-ink">{m.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Expertise"
            title="A team of medical professionals, pharmacists and researchers."
            description="Every product carries the fingerprint of the specialists behind it — from formulation to distribution."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: FlaskConical, title: "R&D and formulation", body: "Scientific rigor across every stage of product development and quality control." },
              { icon: HeartPulse, title: "Clinical partnerships", body: "Ongoing dialogue with practicing clinicians shapes what we bring to market." },
              { icon: Users, title: "Distributor network", body: "A responsive supply chain built for hospitals, clinics and standalone pharmacies." },
              { icon: Globe2, title: "Cultural sensitivity", body: "Healthcare solutions adapted for the communities they serve, in India and beyond." },
              { icon: ShieldCheck, title: "Regulatory & quality", body: "Compliant with pharmaceutical standards, audited for consistency and safety." },
              { icon: Sparkles, title: "Patient-centered care", body: "From consult to follow-up — support that extends well past dispensation." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border/60 bg-card p-7 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.35)]">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-brand-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
