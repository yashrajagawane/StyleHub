import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * fields: [{ key, label, type: "text"|"textarea"|"number"|"image"|"checkbox"|"select", options?, colSpan? }]
 * columns: [{ key, label, render? }]
 */
export default function CrudManager({
  title,
  eyebrow,
  endpoint,
  fields,
  columns,
  defaultItem = {},
  itemLabel = "item",
  testIdPrefix = "crud",
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | "new" | item

  const { data, isLoading } = useQuery({
    queryKey: [endpoint, "all"],
    queryFn: () => api.get(endpoint, { params: { limit: 500 } }).then((r) => r.data),
  });

  const closeModal = () => setEditing(null);

  const createMut = useMutation({
    mutationFn: (payload) => api.post(endpoint, payload).then((r) => r.data),
    onSuccess: () => { toast.success(`${itemLabel} created`); qc.invalidateQueries({ queryKey: [endpoint] }); closeModal(); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Create failed"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => api.put(`${endpoint}/${id}`, payload).then((r) => r.data),
    onSuccess: () => { toast.success(`${itemLabel} updated`); qc.invalidateQueries({ queryKey: [endpoint] }); closeModal(); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Update failed"),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`${endpoint}/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: [endpoint] }); },
  });

  const onSubmit = (form) => {
    if (editing === "new") createMut.mutate(form);
    else updateMut.mutate({ id: editing.id, payload: form });
  };

  return (
    <div data-testid={`${testIdPrefix}-page`}>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="font-display text-4xl md:text-5xl leading-none mt-2">{title}</h1>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary" data-testid={`${testIdPrefix}-new`}>
          <Plus size={14} /> New
        </button>
      </div>

      <div className="border border-foreground/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground/10 bg-secondary">
            <tr>
              {columns.map((c) => <th key={c.key} className="text-left px-4 py-3 text-xs uppercase tracking-wider">{c.label}</th>)}
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-foreground/60">Loading...</td></tr>}
            {!isLoading && (data?.items || []).length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-foreground/60">No {itemLabel}s yet.</td></tr>
            )}
            {(data?.items || []).map((it) => (
              <tr key={it.id} className="border-b border-foreground/5 hover:bg-secondary/50" data-testid={`${testIdPrefix}-row-${it.id}`}>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-middle max-w-xs">
                    {c.render ? c.render(it) : <span className="truncate block">{String(it[c.key] ?? "—")}</span>}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(it)} className="p-2 hover:text-foreground" data-testid={`${testIdPrefix}-edit-${it.id}`}><Pencil size={14} /></button>
                  <button onClick={() => window.confirm(`Delete this ${itemLabel}?`) && deleteMut.mutate(it.id)} className="p-2 hover:text-destructive" data-testid={`${testIdPrefix}-delete-${it.id}`}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <CrudModal
          initial={editing === "new" ? defaultItem : editing}
          fields={fields}
          onClose={closeModal}
          onSubmit={onSubmit}
          submitting={createMut.isPending || updateMut.isPending}
          title={editing === "new" ? `New ${itemLabel}` : `Edit ${itemLabel}`}
          testIdPrefix={testIdPrefix}
        />
      )}
    </div>
  );
}

function CrudModal({ initial, fields, onClose, onSubmit, submitting, title, testIdPrefix }) {
  const [form, setForm] = useState(() => {
    const base = { ...initial };
    fields.forEach((f) => {
      if (f.type === "list" && !Array.isArray(base[f.key])) base[f.key] = base[f.key] ? String(base[f.key]).split(",").map((s) => s.trim()).filter(Boolean) : [];
    });
    return base;
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    // Coerce numbers
    const payload = { ...form };
    fields.forEach((f) => {
      if (f.type === "number") payload[f.key] = payload[f.key] === "" || payload[f.key] === null || payload[f.key] === undefined ? null : Number(payload[f.key]);
    });
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border border-foreground/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        data-testid={`${testIdPrefix}-modal`}
      >
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
          <div className="font-display text-2xl">{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={cn(f.colSpan === 6 ? "md:col-span-6" : f.colSpan === 3 ? "md:col-span-3" : f.colSpan === 2 ? "md:col-span-2" : "md:col-span-6")}>
              <label className="eyebrow block mb-2">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea rows={f.rows || 3} value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className="w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm" data-testid={`${testIdPrefix}-field-${f.key}`} />
              ) : f.type === "checkbox" ? (
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!form[f.key]} onChange={(e) => set(f.key, e.target.checked)} data-testid={`${testIdPrefix}-field-${f.key}`} />
                  <span>{f.hint || "Enabled"}</span>
                </label>
              ) : f.type === "select" ? (
                <select value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className="w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm" data-testid={`${testIdPrefix}-field-${f.key}`}>
                  <option value="">— None —</option>
                  {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === "list" ? (
                <input
                  value={(form[f.key] || []).join(", ")}
                  onChange={(e) => set(f.key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder={f.placeholder || "Comma separated"}
                  className="w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm"
                  data-testid={`${testIdPrefix}-field-${f.key}`}
                />
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  step={f.step}
                  value={form[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full border border-foreground/20 bg-transparent px-3 py-2 text-sm"
                  data-testid={`${testIdPrefix}-field-${f.key}`}
                />
              )}
              {f.hint && f.type !== "checkbox" && <div className="text-[11px] text-foreground/50 mt-1">{f.hint}</div>}
            </div>
          ))}
        </div>
        <div className="border-t border-foreground/10 px-6 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button disabled={submitting} className="btn-primary" data-testid={`${testIdPrefix}-submit`}>{submitting ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
