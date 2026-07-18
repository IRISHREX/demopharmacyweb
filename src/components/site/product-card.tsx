import type { Product, Category } from "@/lib/catalog";
import { Pill } from "lucide-react";

interface Props {
  product: Product;
  category?: Category;
}

export function ProductCard({ product, category }: Props) {
  return (
    <article className="group relative flex flex-col rounded-[2rem] border border-border/70 bg-card p-6 transition-all duration-500 card-3d hover:border-primary/30 hover:shadow-elegant">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary group-hover:gradient-brand group-hover:text-primary-foreground transition-colors duration-300">
        <Pill className="h-6 w-6" />
      </div>
      {category && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
          {category.name}
        </p>
      )}
      <h3 className="mt-2 text-lg font-semibold text-brand-ink">{product.name}</h3>
      {product.description && (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {product.description}
        </p>
      )}
      <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
        <span className={product.in_stock ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
          {product.in_stock ? "● Available" : "○ Out of stock"}
        </span>
        <span className="text-muted-foreground">Rx / OTC</span>
      </div>
    </article>
  );
}
