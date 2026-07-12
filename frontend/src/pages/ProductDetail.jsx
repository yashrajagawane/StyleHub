import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { Heart, Share2, Phone, MessageCircle, MapPin, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function CopyLinkBtn() {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}
      className="btn-outline"
      data-testid="share-copy"
    >
      <Share2 size={14} strokeWidth={1.5} /> Share
    </button>
  );
}

export default function ProductDetail() {
  const { slugOrId } = useParams();
  const { settings } = useOutletContext() || {};
  const { has, toggle } = useWishlist();
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [zoom, setZoom] = useState(false);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slugOrId],
    queryFn: () => publicApi.getProduct(slugOrId),
  });
  const { data: related } = useQuery({
    queryKey: ["related", p?.id],
    queryFn: () => publicApi.related(p.id),
    enabled: !!p?.id,
  });

  useEffect(() => {
    // Recently viewed
    if (!p?.id) return;
    try {
      const key = "stylehub_recent";
      const cur = JSON.parse(localStorage.getItem(key) || "[]").filter((x) => x !== p.id);
      cur.unshift(p.id);
      localStorage.setItem(key, JSON.stringify(cur.slice(0, 10)));
    } catch (err) {
      console.warn("Could not persist recently-viewed:", err);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    setActiveImg(0);
    setSize(p.sizes?.[0] || "");
    setColor(p.colors?.[0] || "");
  }, [p?.id, p?.sizes, p?.colors]);

  const hasDiscount = p?.discount_price && p.discount_price < p.price;
  const displayPrice = hasDiscount ? p.discount_price : p?.price;

  const whatsappHref = useMemo(() => {
    if (!p) return "#";
    const num = (settings?.whatsapp || "").replace(/\D/g, "");
    const text = encodeURIComponent(
      `Hi StyleHub — I'd like to reserve "${p.name}" (SKU ${p.sku}${size ? `, size ${size}` : ""}${color ? `, ${color}` : ""}). Is it available?`
    );
    return `https://wa.me/${num}?text=${text}`;
  }, [p, size, color, settings]);

  if (isLoading || !p) {
    return <div className="container-x py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-[4/5] bg-secondary animate-pulse" />
        <div className="space-y-4">
          <div className="h-6 bg-secondary w-1/2 animate-pulse" />
          <div className="h-10 bg-secondary w-3/4 animate-pulse" />
          <div className="h-24 bg-secondary animate-pulse" />
        </div>
      </div>
    </div>;
  }

  const wished = has(p.id);

  return (
    <div className="container-x py-8" data-testid="product-detail-page">
      {/* Breadcrumb */}
      <div className="text-xs uppercase tracking-widerest text-foreground/60 flex items-center gap-2 mb-8">
        <Link to="/">Home</Link><ChevronRight size={12} />
        <Link to="/products">Products</Link><ChevronRight size={12} />
        <span className="text-foreground">{p.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">
        {/* Gallery */}
        <div className="md:col-span-7">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="hidden md:flex md:col-span-1 flex-col gap-3">
              {(p.images || []).map((img, i) => (
                <button
                  key={`thumb-${i}-${img}`}
                  onClick={() => setActiveImg(i)}
                  className={cn("aspect-[4/5] bg-secondary image-zoom-wrap border", i === activeImg ? "border-foreground" : "border-transparent")}
                  data-testid={`thumb-${i}`}
                >
                  <img src={img} alt={`${p.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="md:col-span-5 relative image-zoom-wrap aspect-[4/5] bg-secondary zoom-cursor" onClick={() => setZoom(true)}>
              <img src={p.images?.[activeImg]} alt={p.name} className="w-full h-full object-cover" />
              <button className="absolute bottom-3 right-3 p-2 bg-background/80 backdrop-blur-md border border-foreground/10" aria-label="Zoom" data-testid="zoom-btn">
                <ZoomIn size={16} strokeWidth={1.2} />
              </button>
            </div>
            <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar">
              {(p.images || []).map((img, i) => (
                <button key={`mthumb-${i}-${img}`} onClick={() => setActiveImg(i)} className={cn("min-w-[64px] aspect-square bg-secondary border", i === activeImg ? "border-foreground" : "border-transparent")}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {p.new_arrival && <span className="bg-foreground text-background px-2.5 py-1 text-[10px] uppercase tracking-widerest">New</span>}
            {p.trending && <span className="border border-foreground px-2.5 py-1 text-[10px] uppercase tracking-widerest">Trending</span>}
            {p.best_seller && <span className="border border-foreground px-2.5 py-1 text-[10px] uppercase tracking-widerest">Best Seller</span>}
            {hasDiscount && <span className="bg-gold text-background px-2.5 py-1 text-[10px] uppercase tracking-widerest">Sale</span>}
          </div>

          <div className="eyebrow mb-2">SKU {p.sku}</div>
          <h1 className="font-display text-4xl md:text-5xl leading-[1]">{p.name}</h1>
          <p className="mt-4 text-foreground/70">{p.short_description || p.description?.slice(0, 160)}</p>

          <div className="mt-6 flex items-end gap-4">
            {hasDiscount && <span className="line-through text-foreground/40 text-lg">${p.price}</span>}
            <span className="font-display text-4xl">${displayPrice}</span>
          </div>

          <div className={cn("mt-2 text-xs uppercase tracking-widerest", p.stock > 0 ? "text-foreground/60" : "text-destructive")}>
            {p.stock > 0 ? `Available in shop · ${p.stock} pcs` : "Currently sold out"}
          </div>

          {/* Sizes */}
          {(p.sizes || []).length > 0 && (
            <div className="mt-8">
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-3">Size</div>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={cn("px-4 py-2 text-xs uppercase tracking-wider border", size === s ? "bg-foreground text-background border-foreground" : "border-foreground/20 hover:border-foreground")}
                    data-testid={`size-${s}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {(p.colors || []).length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-3">Color · <span className="text-foreground">{color}</span></div>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={cn("px-3 py-1.5 text-xs border", color === c ? "bg-foreground text-background border-foreground" : "border-foreground/20 hover:border-foreground")}
                    data-testid={`color-${c}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTAs — NO CART / CHECKOUT */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-primary" data-testid="whatsapp-cta">
              <MessageCircle size={14} strokeWidth={1.5} /> WhatsApp to Reserve
            </a>
            <a href={`tel:${settings?.phone || ""}`} className="btn-outline" data-testid="call-cta">
              <Phone size={14} strokeWidth={1.5} /> Call to Reserve
            </a>
            <Link to="/contact" className="btn-outline" data-testid="visit-store-cta">
              <MapPin size={14} strokeWidth={1.5} /> Visit Store
            </Link>
            <button onClick={() => toggle(p.id)} className={cn("inline-flex items-center justify-center gap-2 px-6 py-3 text-xs uppercase tracking-widerest border", wished ? "bg-foreground text-background border-foreground" : "border-foreground")} data-testid="wishlist-btn">
              <Heart size={14} strokeWidth={1.5} className={wished ? "fill-current" : ""} /> {wished ? "Saved" : "Save to Wishlist"}
            </button>
          </div>

          <div className="mt-3 flex justify-start">
            <CopyLinkBtn />
          </div>

          {/* Details */}
          <div className="mt-12 border-t border-foreground/10 pt-8 space-y-6">
            {p.description && (
              <div>
                <div className="eyebrow mb-2">Description</div>
                <p className="text-sm text-foreground/80 leading-relaxed">{p.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {p.material && <><div className="text-foreground/60">Material</div><div>{p.material}</div></>}
              {p.pattern && <><div className="text-foreground/60">Pattern</div><div>{p.pattern}</div></>}
              {p.fit && <><div className="text-foreground/60">Fit</div><div>{p.fit}</div></>}
              {p.sleeve && <><div className="text-foreground/60">Sleeve</div><div>{p.sleeve}</div></>}
              {p.gender && <><div className="text-foreground/60">Gender</div><div className="capitalize">{p.gender}</div></>}
              {p.washing_instructions && <><div className="text-foreground/60">Care</div><div>{p.washing_instructions}</div></>}
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {(related?.items || []).length > 0 && (
        <section className="mt-32">
          <h2 className="font-display text-3xl md:text-4xl mb-10">You may also love</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.items.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}

      {/* Zoom modal */}
      {zoom && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6" onClick={() => setZoom(false)} data-testid="zoom-modal">
          <img src={p.images?.[activeImg]} alt={p.name} className="max-h-[92vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
