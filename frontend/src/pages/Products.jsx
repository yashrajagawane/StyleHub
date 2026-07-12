import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { SlidersHorizontal, X } from "lucide-react";

const SORTS = [
  { v: "newest", l: "Newest" },
  { v: "price_asc", l: "Price: Low → High" },
  { v: "price_desc", l: "Price: High → Low" },
  { v: "name", l: "Alphabetical" },
];

const GENDERS = ["men", "women", "unisex", "kids"];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo(() => {
    const obj = { limit: 24, active: true };
    const keys = ["q", "category_id", "brand_id", "gender", "min_price", "max_price", "size", "color", "featured", "trending", "new_arrival", "best_seller", "on_offer", "sort"];
    keys.forEach((k) => {
      const v = params.get(k);
      if (v !== null && v !== "") {
        obj[k] = ["min_price", "max_price"].includes(k) ? Number(v)
          : ["featured", "trending", "new_arrival", "best_seller", "on_offer"].includes(k) ? v === "true"
          : v;
      }
    });
    return obj;
  }, [params]);

  const { data, isLoading } = useQuery({
    queryKey: ["products-list", filters],
    queryFn: () => publicApi.listProducts(filters),
  });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => publicApi.categories({ active: true }) });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => publicApi.brands({ active: true }) });

  const setFilter = (key, val) => {
    const next = new URLSearchParams(params);
    if (val === null || val === undefined || val === "" || val === false) next.delete(key);
    else next.set(key, String(val));
    setParams(next);
  };

  const clearAll = () => setParams(new URLSearchParams());

  const activeCount = [...params.keys()].filter((k) => k !== "sort").length;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [params]);

  return (
    <div className="container-x py-8" data-testid="products-page">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Sidebar filters (desktop) */}
        <aside className={`md:col-span-3 lg:col-span-3 ${filtersOpen ? "block" : "hidden"} md:block`} data-testid="filters-panel">
          <div className="sticky top-28">
            <div className="flex items-center justify-between mb-6">
              <div className="eyebrow">Filters</div>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs uppercase tracking-widerest link-underline" data-testid="filter-clear">Clear ({activeCount})</button>
              )}
            </div>

            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-3">Category</div>
              <ul className="space-y-1.5 text-sm">
                <li><button onClick={() => setFilter("category_id", "")} className={`link-underline ${!params.get("category_id") ? "font-medium" : "text-foreground/70"}`}>All</button></li>
                {(cats?.items || []).map((c) => (
                  <li key={c.id}>
                    <button onClick={() => setFilter("category_id", c.id)} className={`link-underline ${params.get("category_id") === c.id ? "font-medium" : "text-foreground/70"}`} data-testid={`filter-cat-${c.slug}`}>
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-3">Brand</div>
              <ul className="space-y-1.5 text-sm">
                <li><button onClick={() => setFilter("brand_id", "")} className={`link-underline ${!params.get("brand_id") ? "font-medium" : "text-foreground/70"}`}>All</button></li>
                {(brands?.items || []).map((b) => (
                  <li key={b.id}>
                    <button onClick={() => setFilter("brand_id", b.id)} className={`link-underline ${params.get("brand_id") === b.id ? "font-medium" : "text-foreground/70"}`} data-testid={`filter-brand-${b.slug}`}>
                      {b.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-3">Gender</div>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <button key={g} onClick={() => setFilter("gender", params.get("gender") === g ? "" : g)}
                    className={`px-3 py-1.5 text-xs uppercase tracking-wider border ${params.get("gender") === g ? "bg-foreground text-background border-foreground" : "border-foreground/20"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-3">Price</div>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" defaultValue={params.get("min_price") || ""} onBlur={(e) => setFilter("min_price", e.target.value)} className="w-full border border-foreground/20 bg-transparent px-2 py-2 text-sm" />
                <input type="number" placeholder="Max" defaultValue={params.get("max_price") || ""} onBlur={(e) => setFilter("max_price", e.target.value)} className="w-full border border-foreground/20 bg-transparent px-2 py-2 text-sm" />
              </div>
            </div>

            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-3">Collection</div>
              <div className="flex flex-wrap gap-2">
                {[["featured", "Featured"], ["new_arrival", "New"], ["trending", "Trending"], ["best_seller", "Best Seller"], ["on_offer", "On Offer"]].map(([k, l]) => {
                  const on = params.get(k) === "true";
                  return (
                    <button key={k} onClick={() => setFilter(k, on ? "" : "true")}
                      className={`px-3 py-1.5 text-xs uppercase tracking-wider border ${on ? "bg-foreground text-background border-foreground" : "border-foreground/20"}`}>
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <section className="md:col-span-9 lg:col-span-9">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <div className="eyebrow mb-2">The Collection</div>
              <h1 className="font-display text-4xl md:text-5xl leading-none">
                {params.get("q") ? `"${params.get("q")}"` : "All Products"}
              </h1>
              <div className="mt-2 text-sm text-foreground/60">{data?.total || 0} pieces</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setFiltersOpen((x) => !x)} className="md:hidden inline-flex items-center gap-2 border border-foreground/20 px-3 py-2 text-xs uppercase tracking-wider" data-testid="filters-toggle">
                {filtersOpen ? <X size={14} /> : <SlidersHorizontal size={14} />} Filters
              </button>
              <select
                value={params.get("sort") || "newest"}
                onChange={(e) => setFilter("sort", e.target.value)}
                className="border border-foreground/20 bg-transparent px-3 py-2 text-xs uppercase tracking-wider"
                data-testid="sort-select"
              >
                {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary animate-pulse" />)}
            </div>
          ) : (data?.items || []).length === 0 ? (
            <div className="py-24 text-center">
              <div className="font-display text-3xl">Nothing matches — yet.</div>
              <p className="mt-3 text-foreground/60">Try loosening a filter, or clear all.</p>
              <button onClick={clearAll} className="btn-outline mt-6">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" data-testid="products-grid">
              {data.items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
