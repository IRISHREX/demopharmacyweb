import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Clock, Globe2, Award, Sparkles } from "lucide-react";
import { fetchCategories, fetchFeaturedProducts } from "@/lib/catalog";
import { SectionHeading } from "@/components/site/section-heading";
import { ProductCard } from "@/components/site/product-card";
import heroImg from "@/assets/hero-pharmacy.jpg";
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
      <section className="relative overflow-hidden gradient-hero">
        <div className="container-page grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              10+ years of pharmaceutical expertise
            </div>
            <div className="typewriter">
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] gradient-heading">
                Trusted medicines for a{" "}
                <span className="italic">healthier tomorrow.</span>
              </h1>
            </div>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Zaxia Healthcare is a Kolkata-based pharmaceutical marketing and trading
              company delivering certified, high-quality formulations across India — with
              trust, innovation and patient-centered care.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="btn inline-flex items-center gap-2 rounded-md gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95"
              >
                Explore products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="btn inline-flex items-center rounded-md border border-border bg-card px-6 py-3 text-sm font-medium text-brand-ink hover:border-primary/40"
              >
                Talk to our team
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                ["10+", "Years experience"],
                ["17+", "Certified products"],
                ["24/7", "Emergency supply"],
              ].map(([n, l]) => (
                <div key={l as string}>
                  <dt className="font-display text-3xl font-semibold text-brand-ink">{n}</dt>
                  <dd className="text-xs text-muted-foreground mt-1">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-8 h-72 w-72 rounded-full bg-primary/20 blur-3xl opacity-70 hero-blob" />
            <div className="absolute right-0 top-16 h-52 w-52 rounded-full bg-cyan-200/15 blur-3xl opacity-75 hero-blob animation-delay-2000" />
            <div className="absolute -inset-6 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(124, 87, 255, 0.18),transparent_36%)]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-elegant card-3d transition-transform duration-500 hover:-translate-y-2 hover:shadow-soft">
              <img
                src={heroImg}
                alt="Zaxia Healthcare pharmaceutical capsules"
                width={1600}
                height={1200}
                className="relative h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
              <div className="absolute bottom-5 left-5 rounded-3xl border border-white/15 bg-background/75 p-5 backdrop-blur-xl">
                <img src={logoImg} alt="Zaxia Healthcare logo" className="h-10 w-auto rounded-lg" />
                <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
                  Modern pharma distribution with premium speed, compliance and care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SNIPPET */}
      <section className="py-24">
        <div className="container-page grid gap-14 lg:grid-cols-2 lg:items-center">
          <img
            src={aboutImg}
            alt="Modern pharmaceutical laboratory"
            width={1400}
            height={1000}
            loading="lazy"
            className="rounded-2xl shadow-soft w-full h-auto object-cover aspect-[4/3] order-2 lg:order-1"
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
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all"
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
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all"
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
              <div key={title} className="rounded-2xl border border-border/60 bg-card p-8">
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
                  className="inline-flex items-center gap-2 rounded-md bg-card px-6 py-3 text-sm font-medium text-primary hover:opacity-95"
                >
                  Contact us <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="tel:+918017190377"
                  className="inline-flex items-center rounded-md border border-primary-foreground/30 px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
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
