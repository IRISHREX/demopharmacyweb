import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Clock, Globe2, Award, Sparkles, Facebook, Twitter, Linkedin } from "lucide-react";
import { fetchCategories, fetchFeaturedProducts } from "@/lib/catalog";
import { SectionHeading } from "@/components/site/section-heading";
import { ProductCard } from "@/components/site/product-card";
import heroImg from "@/assets/hero-pharmacy.jpg";
import dnaHeroImg from "@/assets/dna-closeup.jpeg";
import aboutImg from "@/assets/about-lab.jpg";
import logoImg from "@/assets/Zaxia_Logo.png";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Zaxia Healthcare — Trusted Pharmaceutical Solutions" },
      {
        name: "description",
        content:
          "Zaxia Healthcare Pvt. Ltd. delivers certified capsules, tablets, syrups and injections with 10+ years of expertise. Kolkata-based, serving India and beyond.",
      },
    ],
  }),
});

function Home() {
  const products = useQuery({ queryKey: ["featured-products"], queryFn: () => fetchFeaturedProducts(6) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const catMap = new Map((categories.data ?? []).map((c) => [c.id, c]));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden hero-landing shadow-[0_10px_20px_5px_rgba(2,6,23,0.55)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(45deg, color-mix(in oklab, var(--secondary-foreground) 85%, rgba(2, 6, 23, 0.95)) 0%, rgba(2, 6, 23, 0.6) 45%, rgba(2, 6, 23, 0) 60%), url(${dnaHeroImg})` }}
          />
        <div className="container-page relative isolate overflow-hidden px-6 py-20 ">
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="absolute bottom-0 right-0 z-20 flex items-center gap-3">
              {[
                { href: "https://www.facebook.com", icon: Facebook, label: "Facebook" },
                { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
                { href: "https://www.linkedin.com", icon: Linkedin, label: "LinkedIn" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="relative z-10 text-white mt-20">
              <h1 className="mt-6 text-transparent bg-clip-text bg-linear-to-r from-slate-100 via-sky-200 to-cyan-200 text-5xl sm:text-6xl xl:text-7xl font-semibold leading-tight tracking-[-0.03em]">
                Unlock your
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-slate-100 via-sky-200 to-cyan-200 mt-2">
                  Longevity
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg leading-8 text-white">
                All our supplements are certified and clinically tested to support optimal health and longevity.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-secondary-foreground shadow-[0_18px_40px_-24px_rgba(56,189,248,0.9)] hover:bg-sky-400"
                >
                  Explore products <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-slate-100 hover:bg-white/15"
                >
                  Talk to out team
                </Link>
              </div>
              <dl className="mt-12 grid grid-cols-3 gap-4 max-w-md text-center">
                {[
                  ["Clinical", "Certified formulas"],
                  ["Trusted", "Global research"],
                  ["Safe", "Medicine-grade quality"],
                ].map(([n, l]) => (
                  <div key={l as string} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <dt className="text-3xl font-semibold text-white">{n}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-[0.2em] text-sky-200/70">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* <div className="relative z-10">
              <div className="absolute -right-10 top-10 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute left-0 bottom-16 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.55)]">
                <img
                  src={dnaHeroImg}
                  alt="DNA close-up background"
                  width={1600}
                  height={1200}
                  className="h-[560px] w-full object-cover"
                />
                <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-slate-950/50 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur-sm">
                  Gene X Longevity
                </div>
                <div className="absolute inset-x-6 bottom-6 rounded-[2rem] border border-white/15 bg-slate-950/80 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-sky-400 via-cyan-300 to-slate-100 shadow-[0_16px_40px_-24px_rgba(56,189,248,0.9)]" />
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-300/80">Featured formula</p>
                      <p className="mt-1 text-xl font-semibold text-white">Advanced longevity complex</p>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* ABOUT SNIPPET */}
      <section className="py-24">
        <div className="container-page grid gap-14 lg:grid-cols-2 lg:items-center rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:p-12">
          <img
            src={aboutImg}
            alt="Modern pharmaceutical laboratory"
            width={1400}
            height={1000}
            loading="lazy"
            className="rounded-2xl shadow-soft w-full h-auto object-cover aspect-4/3 order-2 lg:order-1"
          />
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="About Zaxia"
              title="A commitment to accessible, high-quality healthcare."
              description="We combine deep pharmaceutical expertise with a patient-first philosophy. From specialist consultations and diagnostics to post-treatment follow-up, our comprehensive care model ensures no one is left behind."
            />
            <ul className="mt-8 space-y-4">
              {[
                ["Medical professionals & researchers", "A dedicated team of pharmacists, doctors and scientists behind every formulation."],
                ["Certified across therapeutic areas", "Capsules, tablets, syrups and injections engineered to international quality standards."],
                ["24/7 access via distributor network", "Partnerships with clinics and distributors ensure essential medicines are always within reach."],
              ].map(([h, p]) => (
                <li key={h} className="flex gap-4">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="font-medium text-brand-ink">{h}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{p}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-primary hover:gap-2.5 transition-all"
            >
              Learn more about us <ArrowRight className="h-4 w-4" />
            </Link>

          </div>
        </div>
      </section>
      {/* KEY PRODUCTS */}
      
      <section className="py-24 bg-surface">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <SectionHeading
              eyebrow="Key products"
              title="Formulations trusted by clinicians."
              description="A snapshot of our featured range — spanning gastro, pain management, nutrition and respiratory care."
            />
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-primary hover:gap-2.5 transition-all"
            >
              View full catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {products.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl border border-border/60 bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(products.data ?? []).map((p) => (
                <ProductCard key={p.id} product={p} category={p.category_id ? catMap.get(p.category_id) : undefined} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow="Why Zaxia"
            title="Global reach, local touch."
            description="Comprehensive care that meets international standards, delivered with cultural sensitivity and transparent guidance."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: Globe2, title: "Global reach, local touch", body: "Healthcare solutions delivered with the cultural sensitivity your community deserves." },
              { icon: Award, title: "Top-tier partner facilities", body: "We work with accredited hospitals and clinics that meet international quality standards." },
              { icon: Clock, title: "Comprehensive care", body: "Visa guidance, cost estimates, follow-up and rehabilitation — support at every step." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border/60 bg-card p-8 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.35)]">
                <div className="grid h-12 w-12 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-soft">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-brand-ink">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl gradient-brand px-8 py-16 md:px-16 md:py-20 text-primary-foreground">
            <div className="relative max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-semibold text-primary-foreground gradient-heading">
                Partner with a healthcare team you can trust.
              </h2>
              <p className="mt-4 text-primary-foreground/85 text-lg">
                Distributor enquiries, clinician partnerships and product information — we're
                here to help.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-medium text-primary hover:opacity-95"
                >
                  Contact us <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="tel:+918017190377"
                  className="inline-flex items-center rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Call 80171-90377
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
