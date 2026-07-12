import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Link } from "react-router-dom";
import { ShoppingBag, Tag, Building2, Percent, MessageSquare, AlertTriangle, Mail, TrendingUp, MessageCircle, Send } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function Metric({ icon: Icon, label, value, foot, to, tone = "" }) {
  const Wrap = to ? Link : "div";
  return (
    <Wrap to={to} className="block border border-foreground/10 p-6 hover:border-foreground transition-colors bg-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="eyebrow">{label}</div>
          <div className="font-display text-4xl mt-2">{value ?? "—"}</div>
          {foot && <div className={`mt-1 text-xs ${tone === "warn" ? "text-destructive" : "text-foreground/60"}`}>{foot}</div>}
        </div>
        <Icon size={20} strokeWidth={1.2} className="opacity-60" />
      </div>
    </Wrap>
  );
}

export default function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get("/analytics/summary").then((r) => r.data),
  });
  const { data: wa } = useQuery({
    queryKey: ["whatsapp-analytics"],
    queryFn: () => api.get("/whatsapp/analytics", { params: { days: 30 } }).then((r) => r.data),
  });

  return (
    <div data-testid="admin-dashboard">
      <div className="mb-10">
        <div className="eyebrow">Overview</div>
        <h1 className="font-display text-4xl md:text-5xl leading-none mt-2">Boutique dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric icon={ShoppingBag} label="Products" value={data?.active_products} foot={`${data?.total_products || 0} total`} to="/admin/products" />
        <Metric icon={Tag} label="Categories" value={data?.total_categories} to="/admin/categories" />
        <Metric icon={Building2} label="Brands" value={data?.total_brands} to="/admin/brands" />
        <Metric icon={Percent} label="Active Offers" value={data?.total_offers} to="/admin/offers" />
        <Metric icon={MessageSquare} label="Inquiries" value={data?.total_inquiries} foot={`${data?.new_inquiries || 0} new`} to="/admin/inquiries" />
        <Metric icon={AlertTriangle} label="Low Stock" value={data?.low_stock} foot={data?.low_stock ? "needs restock" : "all clear"} tone={data?.low_stock ? "warn" : ""} to="/admin/products?low=1" />
        <Metric icon={Mail} label="Newsletter" value={data?.newsletter_subs} foot="subscribers" />
        <Metric icon={TrendingUp} label="Stock Value" value={formatINR(Math.round(data?.total_stock_value || 0))} foot="wholesale" />
      </div>

      {/* WhatsApp analytics */}
      <div className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="eyebrow">WhatsApp — last 30 days</div>
            <h2 className="font-display text-2xl md:text-3xl">Chat & reservations</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric icon={MessageCircle} label="Total WA clicks" value={data?.whatsapp_total ?? 0} foot="last 30 days" />
          <Metric icon={Send} label="Inquiries" value={data?.whatsapp_inquiries ?? 0} foot="product page" />
          <Metric icon={MessageCircle} label="Reservations" value={data?.whatsapp_reservations ?? 0} foot="product page" tone={data?.whatsapp_reservations ? "" : ""} />
          <Metric icon={MessageCircle} label="Floating chat" value={wa?.floating_clicks ?? 0} foot="bubble opens" />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-foreground/10 p-6 bg-card">
            <div className="eyebrow mb-4">Clicks over time</div>
            <div className="h-56 min-h-[224px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={224}>
                <LineChart data={wa?.timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ border: "1px solid #00000020", background: "white" }} />
                  <Line type="monotone" dataKey="count" stroke="#25D366" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="border border-foreground/10 p-6 bg-card">
            <div className="eyebrow mb-4">Most contacted products</div>
            <ul className="space-y-3" data-testid="wa-top-products">
              {(wa?.top_products || []).map((p) => (
                <li key={p.product_id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{p.name}</div>
                    <div className="text-xs text-foreground/60">{p.sku} · {p.inquiries} inq · {p.reservations} res</div>
                  </div>
                  <div className="font-display text-xl">{p.count}</div>
                </li>
              ))}
              {(!wa?.top_products || wa.top_products.length === 0) && (
                <li className="text-sm text-foreground/60">No WhatsApp clicks yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-foreground/10 p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="eyebrow">Products by Category</div>
          </div>
          <div className="h-72 min-h-[288px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={288}>
              <BarChart data={data?.by_category || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ border: "1px solid #00000020", background: "white" }} />
                <Bar dataKey="count" fill="#0A0A0A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border border-foreground/10 p-6 bg-card">
          <div className="eyebrow mb-4">Most viewed products</div>
          <ul className="space-y-4">
            {(data?.top_products || []).map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <img src={p.images?.[0]} alt="" className="w-12 h-14 object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/products?edit=${p.id}`} className="link-underline text-sm block truncate">{p.name}</Link>
                  <div className="text-xs text-foreground/60">{p.views || 0} views · {formatINR(p.price)}</div>
                </div>
              </li>
            ))}
            {(!data?.top_products || data.top_products.length === 0) && (
              <li className="text-sm text-foreground/60">No views yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
