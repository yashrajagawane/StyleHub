import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { buildWhatsAppLink, trackWhatsAppClick } from "@/lib/whatsapp";
import { MessageCircle, X } from "lucide-react";

/**
 * Floating WhatsApp bubble shown on all public pages.
 * Hidden when settings.whatsapp_floating_enabled is false, when the whatsapp
 * number is empty, or on admin routes (see PublicLayout which is the only mount).
 */
export default function FloatingWhatsApp() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: publicApi.settings,
  });
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("stylehub_wa_dismissed") === "1"; }
    catch { return false; }
  });

  useEffect(() => {
    if (dismissed) {
      try { sessionStorage.setItem("stylehub_wa_dismissed", "1"); } catch {}
    }
  }, [dismissed]);

  if (!settings) return null;
  if (settings.whatsapp_enabled === false) return null;
  if (settings.whatsapp_floating_enabled === false) return null;
  if (!settings.whatsapp) return null;
  if (dismissed) return null;

  const { url } = buildWhatsAppLink({
    phone: settings.whatsapp,
    template: settings.whatsapp_floating_message,
    vars: { store: settings.store_name },
  });
  if (!url) return null;

  const onClick = () => {
    trackWhatsAppClick({ event_type: "floating" });
  };

  return (
    <div className="fixed bottom-5 right-5 z-40" data-testid="floating-whatsapp">
      {open && (
        <div className="mb-3 w-72 bg-background border border-foreground/10 shadow-2xl p-4" data-testid="floating-whatsapp-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-lg leading-tight">Talk to us on WhatsApp</div>
              <div className="text-xs text-foreground/60 mt-1">
                Typical reply within an hour, during boutique hours.
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-1 -mt-1 -mr-1 opacity-60 hover:opacity-100"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={onClick}
            className="btn-primary w-full mt-4 justify-center"
            data-testid="floating-whatsapp-cta"
          >
            <MessageCircle size={14} strokeWidth={1.5} /> Start chat
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="mt-2 w-full text-[10px] uppercase tracking-widerest text-foreground/50 hover:text-foreground"
          >
            Don't show again this session
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe57] shadow-lg flex items-center justify-center transition-transform hover:-translate-y-0.5"
        data-testid="floating-whatsapp-button"
      >
        <MessageCircle size={26} strokeWidth={1.6} className="text-white" />
      </button>
    </div>
  );
}
