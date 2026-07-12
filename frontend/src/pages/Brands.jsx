import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export default function Brands() {
  const { data } = useQuery({ queryKey: ["brands"], queryFn: () => publicApi.brands({ active: true }) });
  const items = data?.items || [];
  const featured = items.filter((b) => b.featured);
  const rest = items.filter((b) => !b.featured);

  return (
    <div className="container-x py-12" data-testid="brands-page">
      <div className="max-w-2xl mb-16">
        <div className="eyebrow mb-3">Brands</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Houses we stock</h1>
        <p className="mt-4 text-foreground/70">Independent ateliers, quiet-luxury heritage houses, and one-of-a-kind makers from Paris to Kyoto.</p>
      </div>

      {featured.length > 0 && (
        <>
          <div className="eyebrow mb-6">Featured</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {featured.map((b) => (
              <Link key={b.id} to={`/products?brand_id=${b.id}`} className="group image-zoom-wrap relative aspect-[16/9] bg-secondary" data-testid={`brand-${b.slug}`}>
                <img src={b.logo} alt={b.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-background">
                  <div className="font-display text-4xl md:text-5xl">{b.name}</div>
                  <div className="mt-2 max-w-md text-sm opacity-80">{b.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="eyebrow mb-6">Also in the shop</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {rest.map((b) => (
          <Link key={b.id} to={`/products?brand_id=${b.id}`} className="group border border-foreground/10 p-6 hover:border-foreground transition-colors">
            <div className="aspect-video image-zoom-wrap bg-secondary mb-4">
              <img src={b.logo} alt={b.name} className="w-full h-full object-cover" />
            </div>
            <div className="font-display text-xl">{b.name}</div>
            <div className="text-xs text-foreground/60 mt-1">{b.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
