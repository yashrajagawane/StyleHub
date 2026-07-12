import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";

function Badge({ children, tone = "dark" }) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 text-[10px] uppercase tracking-widerest",
        tone === "dark" ? "bg-foreground text-background" : "bg-background text-foreground border border-foreground"
      )}
    >
      {children}
    </span>
  );
}

export default function ProductCard({ p, priority = false }) {
  const { has, toggle } = useWishlist();
  const wished = has(p.id);
  const hasDiscount = p.discount_price && p.discount_price < p.price;
  const displayPrice = hasDiscount ? p.discount_price : p.price;

  return (
    <Link
      to={`/products/${p.slug || p.id}`}
      className="group block reveal"
      data-testid={`product-card-${p.slug || p.id}`}
    >
      <div className="relative image-zoom-wrap bg-secondary aspect-[4/5]">
        <img
          src={p.images?.[0]}
          alt={p.name}
          loading={priority ? "eager" : "lazy"}
          className="w-full h-full object-cover"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {p.new_arrival && <Badge>New</Badge>}
          {p.trending && <Badge tone="light">Trending</Badge>}
          {hasDiscount && <Badge>−{Math.round(((p.price - p.discount_price) / p.price) * 100)}%</Badge>}
        </div>

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.id); }}
          className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-md border border-foreground/10 hover:bg-background"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          data-testid={`wishlist-toggle-${p.slug || p.id}`}
        >
          <Heart
            size={16}
            strokeWidth={1.2}
            className={cn(wished ? "fill-foreground text-foreground" : "text-foreground")}
          />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-foreground text-background text-[10px] uppercase tracking-widerest text-center py-2">
            View Details
          </div>
        </div>
      </div>

      <div className="pt-4 pb-2 flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-lg leading-tight">{p.name}</div>
          <div className="mt-1 text-xs text-foreground/60 uppercase tracking-wider">
            {p.material || (p.tags || [])[0] || "Curated piece"}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-body text-sm">
            {hasDiscount && <span className="line-through text-foreground/40 mr-2">${p.price}</span>}
            <span>${displayPrice}</span>
          </div>
          <div className={cn("mt-1 text-[10px] uppercase tracking-widerest", p.stock > 0 ? "text-foreground/60" : "text-destructive")}>
            {p.stock > 0 ? "In shop" : "Sold out"}
          </div>
        </div>
      </div>
    </Link>
  );
}
