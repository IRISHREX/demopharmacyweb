import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import logoImg from "@/assets/Zaxia_Logo.png";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function SiteFooter() {
  const { data: settings } = useSiteSettings();
  const logoSrc = settings?.logo_url || logoImg;
  const siteName = settings?.site_name || "Zaxia Healthcare";
  const address = settings?.address || "127/24, Dhankal, Hatiara, Kolkata – 700157, West Bengal";
  const phone = settings?.phone || "+91 80171-90377";
  const email = settings?.email || "zaxiahealthcare@gmail.com";
  const quote = settings?.quote_text;
  const quoteBy = settings?.quote_author;

  return (
    <footer className="mt-24 rounded-t-[2rem] border-t bg-primary text-primary-foreground backdrop-blur-xl">
      {quote && (
        <div className="container-page pt-10">
          <blockquote className="rounded-2xl border border-white/20 bg-white/5 p-5 text-center">
            <p className="italic text-primary-foreground/95">“{quote}”</p>
            {quoteBy && <footer className="mt-2 text-xs uppercase tracking-widest text-primary-foreground/70">— {quoteBy}</footer>}
          </blockquote>
        </div>
      )}
      <div className="container-page py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt={`${siteName} logo`}
              className="h-18 w-18 rounded-2xl border border-white/10 bg-white/10 object-contain shadow-soft"
            />
          </div>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80 leading-relaxed">
            {settings?.tagline ||
              "Pharmaceutical marketing and trading company committed to accessible, high-quality healthcare across India and beyond — with trust, innovation and patient-centered care at the core."}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/80">
            <li><Link to="/" className="hover:text-primary-foreground">Home</Link></li>
            <li><Link to="/about" className="hover:text-primary-foreground">About Us</Link></li>
            <li><Link to="/products" className="hover:text-primary-foreground">Products</Link></li>
            <li><Link to="/careers" className="hover:text-primary-foreground">Careers</Link></li>
            <li><Link to="/contact" className="hover:text-primary-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider">Reach us</h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="whitespace-pre-line">{address}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="h-4 w-4 mt-0.5 shrink-0" />
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-primary-foreground">{phone}</a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="h-4 w-4 mt-0.5 shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-primary-foreground break-all">{email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container-page py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-primary-foreground/80">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <p>Registered with RoC-Kolkata</p>
        </div>
      </div>
    </footer>
  );
}
