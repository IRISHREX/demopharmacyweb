import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import logoImg from "@/assets/Zaxia_Logo.png";

export function SiteFooter() {
  return (
    <footer className="mt-24 rounded-t-[2rem] border-t bg-primary text-primary-foreground shadow-[0_32px_90px_-56px_rgba(64, 224, 255, 0.45)] backdrop-blur-xl">
      <div className="container-page py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Zaxia Healthcare logo"
              className="h-18 w-18 rounded-2xl border border-white/10 bg-white/10 object-contain shadow-soft"
            />
          </div>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80 leading-relaxed">
            Pharmaceutical marketing and trading company committed to accessible,
            high-quality healthcare across India and beyond — with trust, innovation
            and patient-centered care at the core.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground">
            Explore
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/80">
            <li><Link to="/" className="hover:text-primary-foreground">Home</Link></li>
            <li><Link to="/about" className="hover:text-primary-foreground">About Us</Link></li>
            <li><Link to="/products" className="hover:text-primary-foreground">Products</Link></li>
            <li><Link to="/contact" className="hover:text-primary-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground">
            Reach us
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary-foreground" />
              <span>127/24, Dhankal, Hatiara,<br />Kolkata – 700157, West Bengal</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary-foreground" />
              <a href="tel:+918017190377" className="hover:text-primary-foreground">80171-90377</a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary-foreground" />
              <a href="mailto:zaxiahealthcare@gmail.com" className="hover:text-primary-foreground break-all">
                zaxiahealthcare@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container-page py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-primary-foreground/80">
          <p>© {new Date().getFullYear()} Zaxia Healthcare Pvt. Ltd. All rights reserved.</p>
          <p>Registered with RoC-Kolkata</p>
        </div>
      </div>
    </footer>
  );
}
