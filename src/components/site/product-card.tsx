import { useState } from "react";
import type { Product, Category } from "@/lib/catalog";
import { Pill, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MediaPreview } from "@/components/site/media-upload";

// Import all product images with new names
import calxiaD3Nano from "@/assets/products/CALXIA-D3 NANO SHOT.jpg";
import calxiaD3Softgel from "@/assets/products/CALXIA-D3 SOFTGEL CAPSULES.jpg";
import calxiaK27 from "@/assets/products/CALXIA-K27 SOFTGEL CAPSULES.jpg";
import esmoxiaDsr from "@/assets/products/ESMOXIA-DSR CAPSULES.jpg";
import esmoxiaLs from "@/assets/products/ESMOXIA-LS.jpg";
import levozaxMSyrup from "@/assets/products/LEVOZAX-M SYRUP.jpg";
import levozaxMTablets from "@/assets/products/LEVOZAX-M TABLETS.jpg";
import mefdot from "@/assets/products/MEFDOT TABLETS.jpg";
import pantoxiaDsr from "@/assets/products/PANTOXIA-DSR CAPSULES.jpg";
import pantoxiaIv from "@/assets/products/PANTOXIA-IV INJECTION.jpg";
import zaceP from "@/assets/products/ZACE-P TABLETS.jpg";
import zaceSp from "@/assets/products/ZACE-SP TABLETS.jpg";
import zaxliv300 from "@/assets/products/ZAXLIV-300 TABLETS.jpg";
import zaxpain from "@/assets/products/ZAXPAIN CAPSULES.jpg";
import zaxstone from "@/assets/products/ZAXSTONE CAPSULES.jpg";
import zaxvitPlusSoftgel from "@/assets/products/ZAXVIT-PLUS SOFTGEL CAPSULES.jpg";
import zaxvitPlusSyrup from "@/assets/products/ZAXVIT-PLUS SYRUP.jpg";

// Product name to image mapping
const productImageMap: Record<string, string> = {
  "ZACE-SP": zaceSp,
  "Zaxvit-Plus": zaxvitPlusSoftgel,
  "Zaxvit-Plus Softgel": zaxvitPlusSoftgel,
  "Zaxvit-Plus Syrup": zaxvitPlusSyrup,
  "Zace-P": zaceP,
  "Pantoxia-IV": pantoxiaIv,
  "PANTOXIA-DSR": pantoxiaDsr,
  "Mefdot": mefdot,
  "LEVOZAX-M": levozaxMTablets,
  "LEVOZAX-M Syrup": levozaxMSyrup,
  "LEVOZAX-M Tablets": levozaxMTablets,
  "ESMOXIA-DSR": esmoxiaDsr,
  "Calxia K27": calxiaK27,
  "CALXIA-K27": calxiaK27,
  "CALXIA-D3": calxiaD3Softgel,
  "CALXIA-D3 Nano Shot": calxiaD3Nano,
  "CALXIA-D3 Nano": calxiaD3Nano,
  // "Zaxvit-Plus Softgel": zaxvitPlusSoftgel,
  "ZAXPAIN": zaxpain,
  "ZAXSTONE": zaxstone,
  "ZAXLIV-300": zaxliv300,
  "ESMOXIA-LS": esmoxiaLs,
};

// Function to find matching product image
function getProductImage(productName: string): string | null {
  // Normalize the product name for matching
  const normalized = productName.toUpperCase().trim();
  
  // Try exact match first
  if (productImageMap[productName]) {
    return productImageMap[productName];
  }
  
  // Try case-insensitive exact match
  for (const [key, value] of Object.entries(productImageMap)) {
    if (key.toUpperCase() === normalized) {
      return value;
    }
  }
  
  // Try flexible partial matching - check if any major keywords match
  for (const [key, value] of Object.entries(productImageMap)) {
    const keyUpper = key.toUpperCase();
    // Extract the main product identifier (e.g., "ZACE-SP" from "ZACE-SP TABLETS")
    const keyParts = keyUpper.split(/[\s\-]+/);
    const nameParts = normalized.split(/[\s\-]+/);
    
    // Check if key parts exist in product name
    const keyMatch = keyParts.filter(p => p.length > 0).every(part => 
      normalized.includes(part)
    );
    
    if (keyMatch) {
      return value;
    }
  }
  
  return null;
}

interface Props {
  product: Product;
  category?: Category;
}

export function ProductCard({ product, category }: Props) {
  const productImage = product.image_url || getProductImage(product.name);
  const [askOpen, setAskOpen] = useState(false);

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border/70 bg-card overflow-hidden transition-all duration-500 card-3d shadow-[0_30px_70px_-30px_rgba(0,0,0,0.35)] hover:border-primary/30 hover:shadow-elegant">
      <button
        type="button"
        onClick={() => setAskOpen(true)}
        aria-label={`Ask a question about ${product.name}`}
        title="Ask about this product"
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-primary shadow-soft ring-1 ring-border/60 backdrop-blur hover:bg-primary hover:text-primary-foreground"
      >
        <Info className="h-4 w-4" />
      </button>
      {productImage ? (
        <div className="relative h-56 w-full overflow-hidden bg-white flex items-center justify-center">
          <MediaPreview url={productImage} className="w-full h-full object-contain p-4" />
        </div>
      ) : (
        <div className="mb-5 flex h-56 w-full items-center justify-center bg-primary/5 rounded-t-[2rem]">
          <div className="flex flex-col items-center gap-2 text-primary/40">
            <Pill className="h-12 w-12" />
          </div>
        </div>
      )}
      <div className="flex flex-col p-6 bg-linear-to-b from-primary/15 via-background/5 to-transparent rounded-t-2xl">
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
      </div>
      <ProductInquiryDialog open={askOpen} onOpenChange={setAskOpen} product={product} />
    </article>
  );
}

function ProductInquiryDialog({
  open, onOpenChange, product,
}: { open: boolean; onOpenChange: (v: boolean) => void; product: Product }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !question.trim()) return toast.error("Name and question are required");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("product_inquiries").insert({
        product_id: product.id,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        question: question.trim(),
      });
      if (error) throw error;
      toast.success("Question sent — we'll get back to you.");
      onOpenChange(false);
      setName(""); setPhone(""); setEmail(""); setQuestion("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ask about {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label>Your name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Phone</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} /></div>
          </div>
          <div className="space-y-1.5"><Label>Your question *</Label><Textarea rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} required maxLength={1000} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send question"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

