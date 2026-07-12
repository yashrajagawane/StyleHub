import React, { useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "@/lib/api";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";

export default function Footer({ settings }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      const res = await publicApi.subscribe(email);
      toast.success(res.message || "Subscribed");
      setEmail("");
    } catch {
      toast.error("Could not subscribe");
    } finally {
      setBusy(false);
    }
  };

  const s = settings || {};

  return (
    <footer className="mt-32 border-t border-black/10 dark:border-white/10" data-testid="site-footer">
      <div className="container-x py-20 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <div className="font-display text-3xl">StyleHub<span className="gold">.</span></div>
          <p className="mt-4 text-sm text-foreground/70 max-w-sm">{s.tagline || "Where fashion meets soul."}</p>
          <p className="mt-8 text-sm text-foreground/70 whitespace-pre-line">{s.address}</p>
          <p className="mt-2 text-sm text-foreground/70">{s.phone}</p>
          <p className="mt-1 text-sm text-foreground/70">{s.email}</p>
        </div>

        <div className="md:col-span-2">
          <div className="eyebrow mb-4">Shop</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="link-underline">All Products</Link></li>
            <li><Link to="/categories" className="link-underline">Categories</Link></li>
            <li><Link to="/brands" className="link-underline">Brands</Link></li>
            <li><Link to="/offers" className="link-underline">Offers</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="eyebrow mb-4">Boutique</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="link-underline">About</Link></li>
            <li><Link to="/gallery" className="link-underline">Gallery</Link></li>
            <li><Link to="/contact" className="link-underline">Visit / Contact</Link></li>
            <li><Link to="/privacy" className="link-underline">Privacy</Link></li>
            <li><Link to="/terms" className="link-underline">Terms</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="eyebrow mb-4">Newsletter</div>
          <p className="text-sm text-foreground/70">Private previews, seasonal openings, and quiet sales — once a month.</p>
          <form onSubmit={submit} className="mt-4 flex border border-foreground" data-testid="newsletter-form">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@atelier.com"
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
              data-testid="newsletter-email"
            />
            <button disabled={busy} className="bg-foreground text-background px-4 text-xs uppercase tracking-widerest disabled:opacity-60" data-testid="newsletter-submit">
              {busy ? "..." : "Join"}
            </button>
          </form>
          <div className="mt-6 flex items-center gap-4 text-foreground/70">
            <a href={s.social?.instagram || "#"} aria-label="Instagram" className="hover:text-foreground"><Instagram size={18} strokeWidth={1.2} /></a>
            <a href={s.social?.facebook || "#"} aria-label="Facebook" className="hover:text-foreground"><Facebook size={18} strokeWidth={1.2} /></a>
            <a href={s.social?.twitter || "#"} aria-label="Twitter" className="hover:text-foreground"><Twitter size={18} strokeWidth={1.2} /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 dark:border-white/10 py-6 text-xs text-foreground/60">
        <div className="container-x flex flex-col md:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} {s.store_name || "StyleHub Boutique"}. All rights reserved.</div>
          <div className="tracking-widerest uppercase">Made in {s.city || "SoHo"} · Est. 2011</div>
        </div>
      </div>
    </footer>
  );
}
