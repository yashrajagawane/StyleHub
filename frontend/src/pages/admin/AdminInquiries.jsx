import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Mail, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = ["new", "read", "replied", "archived"];

export default function AdminInquiries() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries", tab],
    queryFn: () => api.get("/inquiries", { params: { status_f: tab === "all" ? undefined : tab } }).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, s }) => api.put(`/inquiries/${id}`, null, { params: { status_v: s } }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inquiries"] }); toast.success("Updated"); },
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/inquiries/${id}`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inquiries"] }); toast.success("Deleted"); setSelected(null); },
  });

  return (
    <div data-testid="admin-inquiries-page">
      <div className="mb-8">
        <div className="eyebrow">Messages</div>
        <h1 className="font-display text-4xl md:text-5xl leading-none mt-2">Customer Inquiries</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={cn("px-3 py-1.5 text-xs uppercase tracking-widerest border capitalize", tab === s ? "bg-foreground text-background border-foreground" : "border-foreground/20")}>
            {s}
          </button>
        ))}
      </div>

      <div className="border border-foreground/10">
        {isLoading && <div className="p-8 text-center text-foreground/60 text-sm">Loading...</div>}
        {!isLoading && (data?.items || []).length === 0 && <div className="p-8 text-center text-foreground/60 text-sm">No inquiries.</div>}
        {(data?.items || []).map((it) => (
          <div key={it.id} className="border-b border-foreground/5 last:border-0 px-4 py-4 flex items-center gap-4 hover:bg-secondary/50 cursor-pointer" onClick={() => setSelected(it)}>
            <div className={cn("w-2 h-2 rounded-full shrink-0", it.status === "new" ? "bg-destructive" : "bg-foreground/30")} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-foreground/50 truncate">{it.email}</div>
              </div>
              <div className="text-sm text-foreground/70 truncate">{it.subject || it.message}</div>
            </div>
            <div className="text-xs text-foreground/60 whitespace-nowrap hidden sm:block">
              {new Date(it.created_at).toLocaleDateString()}
            </div>
            <span className={cn("text-[10px] uppercase tracking-widerest px-2 py-1 border", it.status === "new" ? "border-destructive text-destructive" : "border-foreground/20")}>{it.status}</span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-background border border-foreground/10 w-full max-w-2xl">
            <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
              <div className="font-display text-2xl">Inquiry</div>
              <button onClick={() => setSelected(null)} className="p-1"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><div className="eyebrow mb-1">From</div>{selected.name}</div>
              <div className="flex flex-wrap gap-4">
                <a href={`mailto:${selected.email}`} className="link-underline flex items-center gap-2 text-sm"><Mail size={14} /> {selected.email}</a>
                {selected.phone && <a href={`tel:${selected.phone}`} className="link-underline flex items-center gap-2 text-sm"><Phone size={14} /> {selected.phone}</a>}
              </div>
              {selected.subject && <div><div className="eyebrow mb-1">Subject</div>{selected.subject}</div>}
              <div><div className="eyebrow mb-1">Message</div><p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{selected.message}</p></div>
              <div className="text-xs text-foreground/60">Received {new Date(selected.created_at).toLocaleString()}</div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-foreground/10">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => { updateStatus.mutate({ id: selected.id, s }); setSelected({ ...selected, status: s }); }}
                    className={cn("px-3 py-1.5 text-xs uppercase tracking-widerest border capitalize", selected.status === s ? "bg-foreground text-background border-foreground" : "border-foreground/20")}>
                    Mark {s}
                  </button>
                ))}
                <button onClick={() => window.confirm("Delete this inquiry?") && del.mutate(selected.id)} className="ml-auto text-destructive text-xs uppercase tracking-widerest hover:underline flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
