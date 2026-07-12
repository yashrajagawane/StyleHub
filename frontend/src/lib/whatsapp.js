import api from "@/lib/api";

/**
 * Normalise a phone number for wa.me links.
 * Strips every character that isn't a digit. Leading + is fine on input.
 */
export function normalisePhone(raw) {
  return String(raw || "").replace(/\D/g, "");
}

/**
 * Fill a template message. Unknown tokens are left as-is with an em-dash fallback
 * when the key exists but the value is empty.
 *
 * Example:
 *   render("Hi, I want {product}", { product: "Trench" }) -> "Hi, I want Trench"
 */
export function renderTemplate(template, vars = {}) {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    if (v === undefined || v === null || v === "") return "—";
    return String(v);
  });
}

/**
 * Build a wa.me URL from a phone number and a message string.
 * Returns null if the phone number is empty.
 */
export function generateWhatsAppURL(phone, message) {
  const p = normalisePhone(phone);
  if (!p) return null;
  const encoded = encodeURIComponent(String(message || ""));
  return `https://wa.me/${p}?text=${encoded}`;
}

/**
 * Convenience: render a template with vars then build a wa.me URL.
 */
export function buildWhatsAppLink({ phone, template, vars }) {
  const message = renderTemplate(template, vars);
  return { url: generateWhatsAppURL(phone, message), message };
}

/**
 * Fire-and-forget analytics tracking. Never blocks the click.
 * event_type: "inquiry" | "reserve" | "floating"
 */
export function trackWhatsAppClick(payload) {
  try {
    api.post("/whatsapp/track", {
      source_url: typeof window !== "undefined" ? window.location.href : "",
      ...payload,
    }).catch(() => {});
  } catch {
    /* never break the user click */
  }
}
