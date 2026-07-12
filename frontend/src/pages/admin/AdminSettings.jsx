import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AdminSettings() {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data) });
  const [form, setForm] = useState({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (parent, k, v) => setForm((f) => ({ ...f, [parent]: { ...(f[parent] || {}), [k]: v } }));

  const mut = useMutation({
    mutationFn: (payload) => api.put("/settings", payload).then((r) => r.data),
    onSuccess: () => toast.success("Settings saved"),
    onError: (e) => toast.error(e?.response?.data?.detail || "Save failed"),
  });

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      map_lat: Number(form.map_lat) || 0,
      map_lng: Number(form.map_lng) || 0,
    };
    mut.mutate(payload);
  };

  if (!data) return <div>Loading...</div>;

  return (
    <form onSubmit={submit} className="max-w-3xl" data-testid="admin-settings-page">
      <div className="mb-8">
        <div className="eyebrow">Configuration</div>
        <h1 className="font-display text-4xl md:text-5xl leading-none mt-2">Store settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {[
          ["store_name", "Store name", 6],
          ["tagline", "Tagline", 6],
          ["about", "About (long)", 6, "textarea"],
          ["email", "Email", 3],
          ["phone", "Phone", 3],
          ["whatsapp", "WhatsApp number (digits only)", 6],
          ["address", "Address", 6, "textarea"],
          ["city", "City", 3],
          ["country", "Country", 3],
          ["map_lat", "Map latitude", 3, "number"],
          ["map_lng", "Map longitude", 3, "number"],
        ].map(([k, label, span, type]) => (
          <div key={k} className={span === 6 ? "md:col-span-6" : span === 3 ? "md:col-span-3" : "md:col-span-2"}>
            <label className="eyebrow block mb-2">{label}</label>
            {type === "textarea" ? (
              <textarea rows={3} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className="w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm" data-testid={`ss-${k}`} />
            ) : (
              <input type={type === "number" ? "number" : "text"} step={type === "number" ? "0.0001" : undefined} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className="w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm" data-testid={`ss-${k}`} />
            )}
          </div>
        ))}

        <div className="md:col-span-6">
          <div className="eyebrow mb-2">Business hours</div>
          <div className="space-y-2">
            {Object.entries(form.business_hours || {}).map(([k, v]) => (
              <div key={k} className="grid grid-cols-12 gap-2">
                <input value={k} readOnly className="col-span-4 border border-foreground/20 bg-secondary px-3 py-2 text-sm" />
                <input value={v} onChange={(e) => setNested("business_hours", k, e.target.value)} className="col-span-8 border border-foreground/20 bg-transparent px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-6">
          <div className="eyebrow mb-2">Social links</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {["instagram", "facebook", "twitter", "pinterest"].map((k) => (
              <input key={k} placeholder={k} value={form.social?.[k] || ""} onChange={(e) => setNested("social", k, e.target.value)} className="border border-foreground/20 bg-transparent px-3 py-2 text-sm" />
            ))}
          </div>
        </div>
      </div>

      <button disabled={mut.isPending} className="btn-primary mt-8" data-testid="ss-save">{mut.isPending ? "Saving..." : "Save settings"}</button>
    </form>
  );
}
