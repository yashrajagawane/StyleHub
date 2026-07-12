import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("admin@stylehub.com");
  const [password, setPassword] = useState("Admin@12345");
  const nav = useNavigate();

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Welcome back");
      nav("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2" data-testid="admin-login-page">
      <div className="relative hidden md:block bg-secondary image-zoom-wrap">
        <img src="https://images.unsplash.com/photo-1621261027519-a71ac66d5a68?w=1600&q=80" alt="Boutique" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent" />
        <div className="absolute bottom-10 left-10 text-background">
          <div className="font-display text-4xl">StyleHub<span className="gold">.</span></div>
          <div className="mt-2 text-xs uppercase tracking-widerest opacity-80">The Atelier — Administration</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 md:p-16 bg-background">
        <form onSubmit={submit} className="w-full max-w-sm" data-testid="admin-login-form">
          <Link to="/" className="eyebrow link-underline">← Back to site</Link>
          <h1 className="font-display text-4xl md:text-5xl leading-none mt-6">Sign in</h1>
          <p className="mt-3 text-foreground/70 text-sm">Owner access to catalogue, inventory & CMS.</p>

          <div className="mt-10 space-y-4">
            <div>
              <label className="eyebrow block mb-2">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm" data-testid="login-email" />
            </div>
            <div>
              <label className="eyebrow block mb-2">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm" data-testid="login-password" />
            </div>
          </div>
          <button disabled={loading} className="btn-primary w-full mt-8" data-testid="login-submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-8 border-t border-foreground/10 pt-6 text-xs text-foreground/60">
            <div className="uppercase tracking-widerest mb-2">Demo credentials</div>
            <div>Email: admin@stylehub.com</div>
            <div>Password: Admin@12345</div>
          </div>
        </form>
      </div>
    </div>
  );
}
