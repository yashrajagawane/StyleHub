import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/ProductCard";

export default function Wishlist() {
  const { ids, clear } = useWishlist();
  const { data } = useQuery({
    queryKey: ["all-products-for-wishlist"],
    queryFn: () => publicApi.listProducts({ limit: 200 }),
  });
  const items = (data?.items || []).filter((p) => ids.includes(p.id));

  return (
    <div className="container-x py-12" data-testid="wishlist-page">
      <div className="flex items-end justify-between gap-6 mb-10">
        <div>
          <div className="eyebrow mb-3">Wishlist</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Saved for later</h1>
          <div className="mt-3 text-sm text-foreground/60">{items.length} piece{items.length !== 1 ? "s" : ""}</div>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-xs uppercase tracking-widerest link-underline" data-testid="wishlist-clear">Clear wishlist</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-3xl">Nothing saved yet.</p>
          <p className="mt-2 text-foreground/60">Tap the heart on any piece you'd like to consider later.</p>
          <Link to="/products" className="btn-primary mt-8 inline-flex">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
