import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, Heart, Menu, X, Sun, Moon, User } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/categories", label: "Categories" },
  { to: "/brands", label: "Brands" },
  { to: "/offers", label: "Offers" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { count } = useWishlist();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSearchOpen(false);
    nav(`/products?q=${encodeURIComponent(q.trim())}`);
    setQ("");
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 glass-header border-b transition-colors",
        scrolled ? "border-black/10 dark:border-white/10" : "border-transparent"
      )}
      data-testid="site-navbar"
    >
      {/* Announcement bar */}
      <div className="border-b border-black/5 dark:border-white/5 bg-foreground text-background">
        <div className="container-x py-2 text-[10px] uppercase tracking-widerest text-center">
          Complimentary alterations · By-appointment styling · Visit us in SoHo
        </div>
      </div>

      <div className="container-x flex items-center justify-between h-16 md:h-20">
        <button
          className="md:hidden -ml-2 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          data-testid="nav-menu-toggle"
        >
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>

        <Link to="/" className="font-display text-2xl md:text-3xl tracking-tight" data-testid="nav-logo">
          StyleHub<span className="gold">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.slice(1).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  "link-underline text-xs uppercase tracking-widerest",
                  isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground"
                )
              }
              data-testid={`nav-link-${n.label.toLowerCase()}`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            className="p-2 hover:opacity-70"
            aria-label="Search"
            data-testid="nav-search-toggle"
            onClick={() => setSearchOpen((s) => !s)}
          >
            <Search size={18} strokeWidth={1.5} />
          </button>
          <button
            className="p-2 hover:opacity-70"
            onClick={toggle}
            aria-label="Toggle theme"
            data-testid="nav-theme-toggle"
          >
            {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </button>
          <Link to="/wishlist" className="p-2 hover:opacity-70 relative" aria-label="Wishlist" data-testid="nav-wishlist">
            <Heart size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[10px] bg-foreground text-background flex items-center justify-center rounded-full">
                {count}
              </span>
            )}
          </Link>
          <Link to="/admin/login" className="p-2 hover:opacity-70 hidden sm:inline-flex" aria-label="Admin" data-testid="nav-admin">
            <User size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Search drawer */}
      {searchOpen && (
        <div className="border-t border-black/10 dark:border-white/10 bg-background">
          <form onSubmit={submitSearch} className="container-x py-4 flex items-center gap-3">
            <Search size={18} strokeWidth={1.5} className="opacity-60" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search cashmere, linen, trench, brands..."
              className="flex-1 bg-transparent outline-none py-2 font-body"
              data-testid="nav-search-input"
            />
            <button className="btn-primary py-2 px-4" data-testid="nav-search-submit">Search</button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-black/10 dark:border-white/10 bg-background">
          <nav className="container-x py-6 flex flex-col gap-4" data-testid="mobile-nav">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn("text-lg font-display", isActive ? "opacity-100" : "opacity-70")
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/admin/login" className="text-lg font-display opacity-70">Admin Login</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
