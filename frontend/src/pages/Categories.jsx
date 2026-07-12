import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export default function Categories() {
  const { data } = useQuery({ queryKey: ["cats"], queryFn: () => publicApi.categories({ active: true }) });

  return (
    <div className="container-x py-12" data-testid="categories-page">
      <div className="max-w-2xl mb-16">
        <div className="eyebrow mb-3">Categories</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">The Departments</h1>
        <p className="mt-4 text-foreground/70">Every category is curated by a lead buyer. Six departments, one philosophy: fewer, finer pieces.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(data?.items || []).map((c, i) => (
          <Link key={c.id} to={`/products?category_id=${c.id}`} className="group image-zoom-wrap relative aspect-[4/5] bg-secondary" data-testid={`cat-${c.slug}`}>
            <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-between text-background">
              <div className="text-xs uppercase tracking-widerest opacity-80">Department {String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="font-display text-3xl md:text-4xl leading-tight">{c.name}</div>
                <div className="mt-2 text-sm opacity-80 max-w-xs">{c.description}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
