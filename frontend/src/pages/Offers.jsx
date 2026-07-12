import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export default function Offers() {
  const { data } = useQuery({ queryKey: ["offers-all"], queryFn: () => publicApi.offers({ active: true }) });
  const items = data?.items || [];

  return (
    <div className="container-x py-12" data-testid="offers-page">
      <div className="max-w-2xl mb-16">
        <div className="eyebrow mb-3">Offers</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Currently at the boutique</h1>
        <p className="mt-4 text-foreground/70">A small handful of thoughtfully-priced pieces, available in-store only. Mention the code at checkout.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((o) => (
          <div key={o.id} className="group border border-foreground/10 hover:border-foreground transition-colors" data-testid={`offer-${o.id}`}>
            <div className="image-zoom-wrap aspect-[16/9] bg-secondary">
              <img src={o.image} alt={o.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-3">
                {o.code && <span className="border border-foreground px-3 py-1 text-[10px] uppercase tracking-widerest">{o.code}</span>}
                {o.discount_percent && <span className="text-sm text-foreground/70">Save {o.discount_percent}%</span>}
              </div>
              <div className="font-display text-3xl">{o.title}</div>
              <p className="mt-3 text-foreground/70 text-sm">{o.description}</p>
              <Link to="/contact" className="btn-outline mt-6 inline-flex">Ask about this offer</Link>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-16 text-foreground/60">No active offers right now — check back soon.</div>
        )}
      </div>
    </div>
  );
}
