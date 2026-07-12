import React from "react";
import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Building2,
  Percent,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  LogOut,
  ArrowUpRight,
  Images,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/products", icon: ShoppingBag, label: "Products" },
  { to: "/admin/categories", icon: Tag, label: "Categories" },
  { to: "/admin/brands", icon: Building2, label: "Brands" },
  { to: "/admin/offers", icon: Percent, label: "Offers" },
  { to: "/admin/banners", icon: ImageIcon, label: "Banners" },
  { to: "/admin/gallery", icon: Images, label: "Gallery" },
  { to: "/admin/testimonials", icon: Star, label: "Testimonials" },
  { to: "/admin/inquiries", icon: MessageSquare, label: "Inquiries" },
  { to: "/admin/settings", icon: Settings, label: "Store Settings" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-60 border-r border-foreground/10 py-8 px-4 sticky top-0 h-screen hidden md:flex md:flex-col" data-testid="admin-sidebar">
        <div className="font-display text-2xl px-2 mb-10">StyleHub<span className="gold">.</span></div>
        <nav className="flex-1 space-y-0.5">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 text-sm border-l-2",
                  isActive ? "border-foreground bg-secondary" : "border-transparent text-foreground/70 hover:text-foreground hover:bg-secondary/60"
                )
              }
              data-testid={`admin-nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <l.icon size={16} strokeWidth={1.4} />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-foreground/10 pt-6 space-y-2">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widerest link-underline">
            View site <ArrowUpRight size={12} />
          </a>
          <div className="px-3">
            <div className="text-sm">{user.name}</div>
            <div className="text-xs text-foreground/60">{user.email}</div>
          </div>
          <button
            onClick={() => { logout(); nav("/admin/login"); }}
            className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widerest w-full text-left hover:text-destructive"
            data-testid="admin-logout"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-background border-b border-foreground/10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="font-display text-xl">StyleHub<span className="gold">.</span></div>
          <button onClick={() => { logout(); nav("/admin/login"); }} className="text-xs uppercase tracking-widerest">Log out</button>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 pb-2 border-t border-foreground/5">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => cn("shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-widerest border", isActive ? "bg-foreground text-background border-foreground" : "border-foreground/20")}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 md:p-10 pt-28 md:pt-10 min-w-0" data-testid="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
