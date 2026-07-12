import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { ShoppingBag, Tag, Building2, Percent, MessageSquare, AlertTriangle, Mail, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
        <Metric icon={TrendingUp} label="Stock Value" value={`$${Math.round((data?.total_stock_value || 0)).toLocaleString()}`} foot="wholesale" />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-foreground/10 p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="eyebrow">Products by Category</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
                  <div className="text-xs text-foreground/60">{p.views || 0} views · ${p.price}</div>
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
