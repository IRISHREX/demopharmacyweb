import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Pill } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-surface">
      <div className="container-page py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-primary-foreground">
              <Pill className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold text-brand-ink">
              Zaxia Healthcare
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
            Pharmaceutical marketing and trading company committed to accessible,
            high-quality healthcare across India and beyond — with trust, innovation
            and patient-centered care at the core.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-ink">
            Explore
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link to="/products" className="hover:text-primary">Products</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-ink">
            Reach us
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>127/24, Dhankal, Hatiara,<br />Kolkata – 700157, West Bengal</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <a href="tel:+918017190377" className="hover:text-primary">80171-90377</a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <a href="mailto:zaxiahealthcare@gmail.com" className="hover:text-primary break-all">
                zaxiahealthcare@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container-page py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Zaxia Healthcare Pvt. Ltd. All rights reserved.</p>
          <p>Registered with RoC-Kolkata</p>
        </div>
      </div>
    </footer>
  );
}
