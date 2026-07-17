import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { fetchCategories, fetchProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/site/product-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products")({
  component: Products,
  head: () => ({
    meta: [
      { title: "Products — Zaxia Healthcare Catalog" },
      { name: "description", content: "Explore Zaxia Healthcare's catalog: capsules, tablets, syrups, injections and specialty formulations across therapeutic categories." },
      { property: "og:title", content: "Zaxia Healthcare Product Catalog" },
      { property: "og:description", content: "Certified pharmaceutical products across therapeutic categories." },
    ],
  }),
});

function Products() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const catMap = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );

  const filtered = useMemo(() => {
    let list = products.data ?? [];
    if (cat) list = list.filter((p) => p.category_id === cat);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.description?.toLowerCase().includes(s) ?? false),
      );
    }
    return list;
  }, [products.data, cat, q]);

  return (
    <>
      <section className="gradient-hero">
        <div className="container-page py-16 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Product Catalog</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold">Our pharmaceutical range</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Certified formulations across capsules, tablets, syrups, injections and specialty
            categories — trusted by clinicians and patients alike.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <FilterChip active={cat === null} onClick={() => setCat(null)}>
                All ({products.data?.length ?? 0})
              </FilterChip>
              {(categories.data ?? []).map((c) => {
                const count = (products.data ?? []).filter((p) => p.category_id === c.id).length;
                return (
                  <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                    {c.name} ({count})
                  </FilterChip>
                );
              })}
            </div>
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/40"
              />
            </div>
          </div>

          <div className="mt-10">
            {products.isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl border border-border/60 bg-card animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
                No products match your filters.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    category={p.category_id ? catMap.get(p.category_id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
