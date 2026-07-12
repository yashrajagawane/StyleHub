import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { ArrowUpRight, MapPin, Clock, Star } from "lucide-react";

function SectionHeader({ eyebrow, title, cta, to }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-10">
      <div>
        <div className="eyebrow mb-3">{eyebrow}</div>
        <h2 className="font-display text-3xl md:text-5xl leading-[0.95] tracking-tight max-w-xl">{title}</h2>
      </div>
      {cta && to && (
        <Link to={to} className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-widerest link-underline">
          {cta} <ArrowUpRight size={14} strokeWidth={1.2} />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const { settings } = useOutletContext() || {};
  const { data: banners } = useQuery({ queryKey: ["banners"], queryFn: () => publicApi.banners({ active: true }) });
  const { data: featured } = useQuery({ queryKey: ["featured"], queryFn: () => publicApi.listProducts({ featured: true, limit: 8 }) });
  const { data: newProducts } = useQuery({ queryKey: ["new"], queryFn: () => publicApi.listProducts({ new_arrival: true, limit: 4 }) });
  const { data: trending } = useQuery({ queryKey: ["trend"], queryFn: () => publicApi.listProducts({ trending: true, limit: 8 }) });
  const { data: best } = useQuery({ queryKey: ["best"], queryFn: () => publicApi.listProducts({ best_seller: true, limit: 4 }) });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => publicApi.categories({ active: true }) });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => publicApi.brands({ active: true }) });
  const { data: offers } = useQuery({ queryKey: ["offers"], queryFn: () => publicApi.offers({ active: true }) });
  const { data: testimonials } = useQuery({ queryKey: ["testimonials"], queryFn: () => publicApi.testimonials({ active: true }) });
  const { data: gallery } = useQuery({ queryKey: ["gallery"], queryFn: () => publicApi.gallery({ active: true }) });

  const heroBanners = (banners?.items || []).filter((b) => b.position === "hero");
  const promoBanner = (banners?.items || []).find((b) => b.position === "promo");
  const hero = heroBanners[0];

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="container-x pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7 relative">
            <div className="image-zoom-wrap relative aspect-[4/5] md:aspect-[3/4] bg-secondary">
              {hero && (
                <img src={hero.image} alt={hero.title} className="w-full h-full object-cover" />
              )}
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-end pb-4">
            <div className="eyebrow mb-4">Autumn — Volume 01</div>
            <h1 className="font-display font-medium text-5xl md:text-6xl lg:text-7xl leading-[0.92] tracking-tighter">
              A quiet study<br/>in form, fabric<br/>and finish.
            </h1>
            <p className="mt-6 text-foreground/70 max-w-md">
              Curated silhouettes from Maison Vela, Nord & Line and Atelier Kōgei. Browse the collection online; visit our SoHo atelier to try, tailor and take home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary" data-testid="hero-cta-shop">Explore the Collection</Link>
              <Link to="/contact" className="btn-outline" data-testid="hero-cta-visit">Book an appointment</Link>
            </div>
            <div className="mt-10 flex items-center gap-8 text-xs uppercase tracking-widerest text-foreground/60">
              <div className="flex items-center gap-2"><MapPin size={14} strokeWidth={1.2} /> SoHo, New York</div>
              <div className="flex items-center gap-2"><Clock size={14} strokeWidth={1.2} /> Open until 8pm</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="container-x mt-24">
        <SectionHeader eyebrow="Categories" title="Explore by category" cta="See all" to="/categories" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(cats?.items || []).slice(0, 6).map((c) => (
            <Link key={c.id} to={`/products?category_id=${c.id}`} className="group image-zoom-wrap relative aspect-[3/4] bg-secondary" data-testid={`home-cat-${c.slug}`}>
              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-background">
                <div className="font-display text-lg leading-tight">{c.name}</div>
                <div className="text-[10px] uppercase tracking-widerest opacity-80 mt-0.5">Shop →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals (Bento) */}
      <section className="container-x mt-32">
        <SectionHeader eyebrow="New Arrivals" title="Just landed in the atelier" cta="See all new" to="/products?new_arrival=true" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {(newProducts?.items || []).slice(0, 4).map((p, i) => (
            <div key={p.id} className={i === 0 ? "md:col-span-6 md:row-span-2" : "md:col-span-3"}>
              <ProductCard p={p} priority={i === 0} />
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="container-x mt-32">
        <SectionHeader eyebrow="Trending Now" title="What everyone's coming in for" cta="See all trending" to="/products?trending=true" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {(trending?.items || []).slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Promo banner */}
      {promoBanner && (
        <section className="container-x mt-32">
          <Link to={promoBanner.cta_link || "/offers"} className="block relative image-zoom-wrap aspect-[21/9]" data-testid="promo-banner">
            <img src={promoBanner.image} alt={promoBanner.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center">
              <div className="container-x text-background">
                <div className="eyebrow text-background/70">Featured Offer</div>
                <div className="font-display text-4xl md:text-6xl mt-3 max-w-2xl leading-tight">{promoBanner.title}</div>
                <p className="mt-3 max-w-xl text-background/80">{promoBanner.subtitle}</p>
                <div className="mt-6 inline-block border border-background px-6 py-3 text-xs uppercase tracking-widerest">{promoBanner.cta_text || "View offer"}</div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Best sellers */}
      <section className="container-x mt-32">
        <SectionHeader eyebrow="Best Sellers" title="Wardrobe cornerstones" cta="All best sellers" to="/products?best_seller=true" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {(best?.items || []).slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Featured collection strip */}
      <section className="container-x mt-32">
        <SectionHeader eyebrow="Editor's Cut" title="The Featured Edit" cta="See the edit" to="/products?featured=true" />
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
          {(featured?.items || []).map((p) => (
            <div key={p.id} className="min-w-[260px] md:min-w-[300px] snap-start">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Brands marquee */}
      <section className="mt-32 border-y border-black/10 dark:border-white/10 py-6 overflow-hidden">
        <div className="marquee-track">
          {[...(brands?.items || []), ...(brands?.items || [])].map((b, i) => (
            <Link
              key={i}
              to={`/products?brand_id=${b.id}`}
              className="font-display text-3xl md:text-5xl opacity-40 hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              {b.name} <span className="gold">·</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Offers */}
      <section className="container-x mt-32">
        <SectionHeader eyebrow="Offers" title="Currently at the boutique" cta="All offers" to="/offers" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(offers?.items || []).slice(0, 3).map((o) => (
            <div key={o.id} className="border border-foreground/10 p-8 bg-card" data-testid={`home-offer-${o.id}`}>
              <div className="eyebrow gold">{o.code || "Special"}</div>
              <div className="font-display text-3xl mt-3 leading-tight">{o.title}</div>
              <p className="mt-3 text-sm text-foreground/70">{o.description}</p>
              {o.discount_percent && (
                <div className="mt-6 font-display text-6xl">−{o.discount_percent}<span className="text-3xl align-top">%</span></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="container-x mt-32">
        <SectionHeader eyebrow="Gallery" title="Inside the atelier" cta="Full gallery" to="/gallery" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(gallery?.items || []).slice(0, 4).map((g) => (
            <div key={g.id} className="image-zoom-wrap aspect-square bg-secondary">
              <img src={g.image} alt={g.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x mt-32">
        <SectionHeader eyebrow="Reviews" title="Words from our patrons" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(testimonials?.items || []).map((t) => (
            <div key={t.id} className="border border-foreground/10 p-8 bg-card" data-testid={`testimonial-${t.id}`}>
              <div className="flex items-center gap-1 text-foreground">
                {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} className="fill-current" strokeWidth={0} />)}
              </div>
              <p className="mt-4 font-display text-xl leading-snug">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-foreground/60">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visit / hours */}
      <section className="container-x mt-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 border-t border-foreground/10 pt-16">
          <div className="md:col-span-5">
            <div className="eyebrow mb-4">Visit</div>
            <h2 className="font-display text-4xl md:text-5xl leading-[0.95]">The SoHo Atelier</h2>
            <p className="mt-4 text-foreground/70 max-w-md">{settings?.address}</p>
            <div className="mt-8 space-y-2 text-sm">
              {Object.entries(settings?.business_hours || {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between max-w-sm border-b border-dashed border-foreground/10 py-2">
                  <span className="text-foreground/60 uppercase tracking-wider text-xs">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <a href={`https://wa.me/${(settings?.whatsapp || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-primary" data-testid="visit-whatsapp">WhatsApp us</a>
              <a href={`tel:${settings?.phone || ""}`} className="btn-outline" data-testid="visit-call">Call the shop</a>
            </div>
          </div>
          <div className="md:col-span-7">
            <iframe
              title="Store map"
              className="w-full aspect-[16/10] border border-foreground/10"
              src={`https://www.google.com/maps?q=${settings?.map_lat || 40.7230},${settings?.map_lng || -74.0007}&z=15&output=embed`}
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
