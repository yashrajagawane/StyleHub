import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, X, Minus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { useSearchParams } from "react-router-dom";

const empty = {
  name: "", slug: "", sku: "",
  description: "", short_description: "",
  brand_id: "", category_id: "",
  gender: "unisex",
  price: 0, discount_price: null, stock: 0, low_stock_threshold: 5,
  sizes: [], colors: [],
  material: "", pattern: "", fit: "", sleeve: "", washing_instructions: "",
  images: [],
  featured: false, trending: false, new_arrival: false, best_seller: false, on_offer: false, active: true,
  tags: [],
};

function slugify(s) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export default function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [params] = useSearchParams();
  const showLow = params.get("low") === "1";

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products", q],
    queryFn: () => api.get("/products", { params: { q: q || undefined, limit: 500, active: undefined } }).then((r) => r.data),
  });
  const { data: cats } = useQuery({ queryKey: ["cats-all"], queryFn: () => api.get("/categories", { params: { limit: 500 } }).then((r) => r.data) });
  const { data: brands } = useQuery({ queryKey: ["brands-all"], queryFn: () => api.get("/brands", { params: { limit: 500 } }).then((r) => r.data) });

  const catMap = useMemo(() => Object.fromEntries((cats?.items || []).map((c) => [c.id, c])), [cats]);
  const brandMap = useMemo(() => Object.fromEntries((brands?.items || []).map((b) => [b.id, b])), [brands]);

  const createMut = useMutation({
    mutationFn: (p) => api.post("/products", p).then((r) => r.data),
    onSuccess: () => { toast.success("Product created"); qc.invalidateQueries({ queryKey: ["admin-products"] }); setEditing(null); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Create failed"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/products/${id}`, payload).then((r) => r.data),
    onSuccess: () => { toast.success("Product updated"); qc.invalidateQueries({ queryKey: ["admin-products"] }); setEditing(null); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Update failed"),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
  });
  const stockMut = useMutation({
    mutationFn: ({ id, delta }) => api.post(`/products/${id}/stock`, null, { params: { delta } }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const items = useMemo(() => {
    let list = products?.items || [];
    if (showLow) list = list.filter((p) => p.stock <= p.low_stock_threshold);
    return list;
  }, [products, showLow]);

  return (
    <div data-testid="admin-products-page">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow">Catalogue</div>
          <h1 className="font-display text-4xl md:text-5xl leading-none mt-2">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="border border-foreground/20 bg-transparent px-3 py-2 text-sm" data-testid="admin-products-search" />
          <button onClick={() => setEditing("new")} className="btn-primary" data-testid="admin-products-new"><Plus size={14} /> New Product</button>
        </div>
      </div>

      {showLow && <div className="mb-6 border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive uppercase tracking-widerest inline-block">Showing low stock only</div>}

      <div className="border border-foreground/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground/10 bg-secondary">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Product</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">SKU</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Brand</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Price</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Stock</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider">Flags</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="px-4 py-8 text-center text-foreground/60">Loading...</td></tr>}
            {items.map((p) => (
              <tr key={p.id} className="border-b border-foreground/5 hover:bg-secondary/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0]} alt="" className="w-12 h-14 object-cover" />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-foreground/50 truncate max-w-xs">{p.short_description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">{catMap[p.category_id]?.name || "—"}</td>
                <td className="px-4 py-3">{brandMap[p.brand_id]?.name || "—"}</td>
                <td className="px-4 py-3">{formatINR(p.discount_price || p.price)}{p.discount_price ? <span className="text-foreground/40 line-through ml-1">{formatINR(p.price)}</span> : null}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => stockMut.mutate({ id: p.id, delta: -1 })} className="p-1 border border-foreground/20 hover:border-foreground"><Minus size={12} /></button>
                    <span className={cn("min-w-[28px] text-center", p.stock <= p.low_stock_threshold ? "text-destructive font-medium" : "")}>{p.stock}</span>
                    <button onClick={() => stockMut.mutate({ id: p.id, delta: 1 })} className="p-1 border border-foreground/20 hover:border-foreground"><Plus size={12} /></button>
                  </div>
                </td>
                <td className="px-4 py-3 text-[10px] uppercase tracking-widerest text-foreground/70 space-x-1">
                  {p.featured && <span className="border px-1.5 py-0.5">F</span>}
                  {p.new_arrival && <span className="border px-1.5 py-0.5">N</span>}
                  {p.trending && <span className="border px-1.5 py-0.5">T</span>}
                  {p.best_seller && <span className="border px-1.5 py-0.5">B</span>}
                  {p.on_offer && <span className="border px-1.5 py-0.5">O</span>}
                  {!p.active && <span className="border px-1.5 py-0.5 text-destructive">Off</span>}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(p)} className="p-2"><Pencil size={14} /></button>
                  <button onClick={() => window.confirm("Delete this product?") && deleteMut.mutate(p.id)} className="p-2 hover:text-destructive"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <ProductForm
          initial={editing === "new" ? empty : editing}
          cats={cats?.items || []}
          brands={brands?.items || []}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => (editing === "new" ? createMut.mutate(payload) : updateMut.mutate({ id: editing.id, payload }))}
          submitting={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, cats, brands, onClose, onSubmit, submitting }) {
  const [f, setF] = useState(initial);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.name || !f.sku) return toast.error("Name and SKU required");
    const payload = {
      ...f,
      slug: f.slug || slugify(f.name),
      price: Number(f.price) || 0,
      discount_price: f.discount_price === "" || f.discount_price === null ? null : Number(f.discount_price),
      stock: Number(f.stock) || 0,
      low_stock_threshold: Number(f.low_stock_threshold) || 0,
      sizes: Array.isArray(f.sizes) ? f.sizes : String(f.sizes || "").split(",").map((s) => s.trim()).filter(Boolean),
      colors: Array.isArray(f.colors) ? f.colors : String(f.colors || "").split(",").map((s) => s.trim()).filter(Boolean),
      images: Array.isArray(f.images) ? f.images : String(f.images || "").split(",").map((s) => s.trim()).filter(Boolean),
      tags: Array.isArray(f.tags) ? f.tags : String(f.tags || "").split(",").map((s) => s.trim()).filter(Boolean),
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-background border border-foreground/10 w-full max-w-4xl max-h-[92vh] overflow-y-auto" data-testid="admin-products-modal">
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4 sticky top-0 bg-background z-10">
          <div className="font-display text-2xl">{initial.id ? "Edit product" : "New product"}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1"><X size={18} /></button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4">
          <Field span={4} label="Name"><input required value={f.name} onChange={(e) => set("name", e.target.value)} onBlur={() => !f.slug && set("slug", slugify(f.name))} className="input" data-testid="pf-name" /></Field>
          <Field span={2} label="SKU"><input required value={f.sku} onChange={(e) => set("sku", e.target.value)} className="input" data-testid="pf-sku" /></Field>
          <Field span={3} label="Slug"><input value={f.slug} onChange={(e) => set("slug", e.target.value)} className="input" /></Field>
          <Field span={3} label="Gender">
            <select value={f.gender} onChange={(e) => set("gender", e.target.value)} className="input">
              {["men", "women", "unisex", "kids"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field span={3} label="Category">
            <select value={f.category_id || ""} onChange={(e) => set("category_id", e.target.value || null)} className="input">
              <option value="">—</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field span={3} label="Brand">
            <select value={f.brand_id || ""} onChange={(e) => set("brand_id", e.target.value || null)} className="input">
              <option value="">—</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field span={2} label="Price"><input type="number" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} className="input" data-testid="pf-price" /></Field>
          <Field span={2} label="Discount price"><input type="number" step="0.01" value={f.discount_price ?? ""} onChange={(e) => set("discount_price", e.target.value)} className="input" /></Field>
          <Field span={1} label="Stock"><input type="number" value={f.stock} onChange={(e) => set("stock", e.target.value)} className="input" data-testid="pf-stock" /></Field>
          <Field span={1} label="Low @"><input type="number" value={f.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} className="input" /></Field>

          <Field span={6} label="Short description"><input value={f.short_description} onChange={(e) => set("short_description", e.target.value)} className="input" /></Field>
          <Field span={6} label="Description"><textarea rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} className="input" /></Field>

          <Field span={3} label="Sizes (comma sep)"><input value={(f.sizes || []).join(", ")} onChange={(e) => set("sizes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="input" /></Field>
          <Field span={3} label="Colors"><input value={(f.colors || []).join(", ")} onChange={(e) => set("colors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="input" /></Field>
          <Field span={2} label="Material"><input value={f.material} onChange={(e) => set("material", e.target.value)} className="input" /></Field>
          <Field span={2} label="Pattern"><input value={f.pattern} onChange={(e) => set("pattern", e.target.value)} className="input" /></Field>
          <Field span={2} label="Fit"><input value={f.fit} onChange={(e) => set("fit", e.target.value)} className="input" /></Field>
          <Field span={3} label="Sleeve"><input value={f.sleeve} onChange={(e) => set("sleeve", e.target.value)} className="input" /></Field>
          <Field span={3} label="Care"><input value={f.washing_instructions} onChange={(e) => set("washing_instructions", e.target.value)} className="input" /></Field>

          <Field span={6} label="Image URLs (comma sep)">
            <textarea rows={2} value={(f.images || []).join(", ")} onChange={(e) => set("images", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="input" data-testid="pf-images" />
            {(f.images || []).length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                {f.images.map((url, i) => <img key={`${url}-${i}`} src={url} alt="" className="w-16 h-20 object-cover border border-foreground/10" />)}
              </div>
            )}
          </Field>

          <Field span={6} label="Tags"><input value={(f.tags || []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="input" /></Field>

          <Field span={6} label="Flags">
            <div className="flex flex-wrap gap-4 text-sm">
              {[["featured", "Featured"], ["new_arrival", "New arrival"], ["trending", "Trending"], ["best_seller", "Best seller"], ["on_offer", "On offer"], ["active", "Active"]].map(([k, l]) => (
                <label key={k} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!f[k]} onChange={(e) => set(k, e.target.checked)} /> {l}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="border-t border-foreground/10 px-6 py-4 flex justify-end gap-3 sticky bottom-0 bg-background">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button disabled={submitting} className="btn-primary" data-testid="pf-submit">{submitting ? "Saving..." : "Save"}</button>
        </div>

        <style>{`.input{width:100%;background:transparent;border:1px solid hsl(var(--border));padding:.5rem .75rem;font-size:.875rem}`}</style>
      </form>
    </div>
  );
}

function Field({ span = 6, label, children }) {
  return (
    <div className={cn(span === 6 ? "md:col-span-6" : span === 4 ? "md:col-span-4" : span === 3 ? "md:col-span-3" : span === 2 ? "md:col-span-2" : "md:col-span-1")}>
      <label className="eyebrow block mb-2">{label}</label>
      {children}
    </div>
  );
}
