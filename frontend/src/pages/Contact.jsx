import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { publicApi } from "@/lib/api";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  const { settings } = useOutletContext() || {};
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await publicApi.contact(form);
      toast.success("Message sent — we'll write back within a business day.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not send message");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x py-12" data-testid="contact-page">
      <div className="max-w-2xl mb-16">
        <div className="eyebrow mb-3">Contact / Visit</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Come and see us.</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-start gap-4">
            <MapPin size={20} strokeWidth={1.2} className="mt-1" />
            <div>
              <div className="eyebrow mb-1">Atelier</div>
              <div className="text-foreground/80 whitespace-pre-line">{settings?.address}</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone size={20} strokeWidth={1.2} className="mt-1" />
            <div>
              <div className="eyebrow mb-1">Phone</div>
              <a href={`tel:${settings?.phone}`} className="link-underline">{settings?.phone}</a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Mail size={20} strokeWidth={1.2} className="mt-1" />
            <div>
              <div className="eyebrow mb-1">Email</div>
              <a href={`mailto:${settings?.email}`} className="link-underline">{settings?.email}</a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock size={20} strokeWidth={1.2} className="mt-1" />
            <div>
              <div className="eyebrow mb-1">Hours</div>
              <div className="space-y-1 text-sm text-foreground/80">
                {Object.entries(settings?.business_hours || {}).map(([k, v]) => (
                  <div key={k}><span className="text-foreground/60">{k}:</span> {v}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <iframe
              title="map"
              className="w-full aspect-[4/3] border border-foreground/10"
              src={`https://www.google.com/maps?q=${settings?.map_lat || 40.7230},${settings?.map_lng || -74.0007}&z=15&output=embed`}
              loading="lazy"
            />
          </div>
        </div>

        <form onSubmit={submit} className="lg:col-span-7 border border-foreground/10 p-8 md:p-12 bg-card" data-testid="contact-form">
          <div className="font-display text-3xl mb-6">Write to us</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} className="border border-foreground/20 bg-transparent px-4 py-3 text-sm" data-testid="contact-name" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className="border border-foreground/20 bg-transparent px-4 py-3 text-sm" data-testid="contact-email" />
            <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="border border-foreground/20 bg-transparent px-4 py-3 text-sm" data-testid="contact-phone" />
            <input placeholder="Subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} className="border border-foreground/20 bg-transparent px-4 py-3 text-sm" data-testid="contact-subject" />
          </div>
          <textarea required rows={6} placeholder="Message" value={form.message} onChange={(e) => set("message", e.target.value)} className="mt-4 w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm" data-testid="contact-message" />
          <button disabled={busy} className="btn-primary mt-6" data-testid="contact-submit">
            {busy ? "Sending..." : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}
