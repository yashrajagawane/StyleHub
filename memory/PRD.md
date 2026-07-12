# StyleHub — Product Requirements Document

## Original Problem Statement
Build a production-ready **digital clothing shop showcase & inventory management platform** called **StyleHub** for a local boutique. This is **NOT** an e-commerce site — there is **no cart, no checkout, no online ordering**. Customers browse online and visit the physical store to purchase. The shop owner (single admin) gets a full CMS + inventory management back-office.

Original spec called for Next.js 15 + Express + PostgreSQL + Prisma + Docker; environment constraint required React (CRA) + FastAPI + MongoDB. User accepted best judgment.

## Personas
1. **Public Visitor / Shopper** — browses products, filters, wishlists, contacts the shop via WhatsApp / Call / Visit.
2. **Boutique Owner (Admin)** — one seeded owner account manages entire catalogue, inventory, CMS, offers, banners, gallery, testimonials, inquiries, settings.

## Tech Stack (as-built)
- **Frontend**: React 19 (CRA), React Router 7, TanStack Query, Framer, Tailwind, shadcn/ui primitives, Recharts, Sonner (toasts), Axios, Lucide icons.
- **Backend**: FastAPI (single-file `server.py`), Motor (async MongoDB), JWT (PyJWT), bcrypt.
- **DB**: MongoDB (collections: users, products, categories, brands, offers, gallery, banners, testimonials, inquiries, newsletter, stock_history, settings).
- **Design**: Luxury / editorial — Playfair Display + Manrope, monochrome palette with gold accent, glassmorphism header, image-zoom hover, marquee for brands.

## Architecture Highlights
- All backend routes under `/api` (Kubernetes ingress rule).
- JWT stored in `localStorage` (`stylehub_token`); auto-attached via axios interceptor; 401 auto-redirects to `/admin/login`.
- Wishlist and theme (light/dark) persist in `localStorage`; wishlist requires no login.
- Auto-seed on server startup: admin user + 12 products / 6 categories / 6 brands / 3 offers / 3 banners / 6 gallery items / 3 testimonials / settings.
- Generic `CrudManager` React component powers admin CRUD for categories, brands, offers, banners, gallery, testimonials — reducing duplication.
- Rich, dedicated `AdminProducts` page for the more complex product model (sizes, colors, flags, multiple images, stock adjustments).

## Implemented (v1 — 2026-01-12)
### Public site
- Home (hero + editorial), Products (filters + sort + search + pagination), Product Detail (gallery + zoom + WhatsApp/Call/Visit/Wishlist CTAs + related), Categories, Brands, Offers, Gallery (with lightbox + tabs), About, Contact (form + Google map), Wishlist, Privacy, Terms, 404.
- Global: navbar with search / theme / wishlist counter / admin, footer with newsletter, mobile drawer, dark/light theme toggle, luxury animations.
- **Currency**: switched to Indian Rupees (₹) with `en-IN` formatting via `lib/format.js`.

### Admin
- Login (seeded credentials pre-filled)
- Dashboard (metric cards + by-category bar chart + most-viewed products)
- Products (rich table with inline stock +/− and full modal form)
- Categories, Brands, Offers, Banners, Gallery, Testimonials (via CrudManager)
- Inquiries (tabs by status, mark read/replied/archived, delete, view detail)
- Store Settings (name, tagline, contact, hours, socials, map coords, about)

## Implemented (v2 — 2026-01-12) — WhatsApp Automation
### Public
- **Two WhatsApp CTAs on every product page**: *Reserve via WhatsApp* (primary) and *WhatsApp Inquiry* (secondary). Messages generated from admin-editable templates with tokens `{product_name} {sku} {brand} {price} {size} {color} {product_url} {store}`. Hrefs update live as user changes size/color.
- **Message preview**: expandable `<details>` block on product detail shows the composed message.
- **Floating WhatsApp bubble** on all public pages (never on `/admin/*`), with dismiss-for-session button.
- **Click tracking**: every WhatsApp click POSTs to `/api/whatsapp/track` (anonymous, non-blocking).

### Admin
- **Store Settings** — WhatsApp Automation section: toggles for product buttons + floating bubble, editable templates for floating greeting, inquiry, and reservation.
- **Dashboard** — new "WhatsApp — last 30 days" section with 4 metric cards (Total, Inquiries, Reservations, Floating clicks), timeline line chart, and "Most contacted products" list.

### Backend
- New endpoints: `POST /api/whatsapp/track` (public), `GET /api/whatsapp/analytics` (admin).
- Extended `/api/analytics/summary` with `whatsapp_total / whatsapp_inquiries / whatsapp_reservations`.
- New collection `whatsapp_events` (append-only).
- Settings loader auto-merges new default keys into existing docs (forward-compat).

### Utility
- Reusable `/app/frontend/src/lib/whatsapp.js` — `generateWhatsAppURL`, `buildWhatsAppLink`, `renderTemplate`, `normalisePhone`, `trackWhatsAppClick`.

### APIs
- `/api/auth/login`, `/api/auth/me`
- `/api/products` (list + rich filters), `/api/products/{id}`, `/api/products/{id}/related`, `/api/products/{id}/stock`
- `/api/categories`, `/api/brands`, `/api/offers`, `/api/gallery`, `/api/banners`, `/api/testimonials` — CRUD
- `/api/inquiries` (public POST; admin GET/PUT/DELETE)
- `/api/newsletter` (public POST, dedupe)
- `/api/settings` (public GET, admin PUT)
- `/api/analytics/summary` (admin)

## Testing
- 25/25 backend pytest tests passed (`/app/backend/tests/backend_test.py`).
- 100% frontend E2E via testing agent (data-testid coverage across all pages).
- Manual screenshot verified home page renders correctly.

## Admin Credentials
- Email: `admin@stylehub.com`
- Password: `Admin@12345`

## Backlog (P1/P2 — not shipped in v1)
- **P1**: Cloudinary image upload (currently URLs only); CSV/XLSX import-export; barcode/QR generation on product detail (share only); suppliers module; audit logs page.
- **P2**: Refresh-token rotation with HttpOnly cookie; CSRF; Docker Compose + Nginx; Next.js SSR/SSG parity; product comparison table; multi-image drag-and-drop; sitemap.xml + Open Graph tags per product.
- **P2**: Emergent Google OAuth for staff, per-role permissions (buyer / stylist / owner).

## Next Actions
- User to review live app and provide feedback.
- If image uploads needed, wire Cloudinary (credentials from user).
- If deploying, add Docker Compose file & convert stack per original spec.
