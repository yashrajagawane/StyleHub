# StyleHub — Digital Boutique Showcase & Inventory Platform

> A production-ready **digital showroom** and **inventory back-office** for a physical clothing boutique.
> **Not** an e-commerce site: customers browse online, then visit the store to buy. The shop owner runs
> the entire catalogue, CMS, and analytics from a single admin dashboard.

Live demo: `https://style-hub-tau-ruby.vercel.app/`

---

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Screenshots (What you get)](#screenshots-what-you-get)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Admin / Demo Credentials](#admin--demo-credentials)
- [Seed Data](#seed-data)
- [REST API Reference](#rest-api-reference)
- [Data Models](#data-models)
- [Frontend Architecture](#frontend-architecture)
- [Design System](#design-system)
- [Security](#security)
- [Testing](#testing)
- [Roadmap / Backlog](#roadmap--backlog)
- [FAQ](#faq)
- [License](#license)

---

## Overview

**StyleHub** is a luxury-fashion **digital showroom** for a single boutique.
Customers use it to discover products, filter, save to a wishlist, and then **Call / WhatsApp / Visit**
the store to reserve or buy. There is **no cart and no online checkout by design** — the entire
purchase flow happens in-store.

Behind the scenes, the shop owner uses a full admin dashboard to manage:

- Products, categories, brands, inventory (with stock adjustments & low-stock alerts)
- Offers, homepage banners, gallery images, testimonials
- Customer inquiries (contact form triage)
- Store settings (name, tagline, address, business hours, map coords, socials, about)
- Analytics (top-viewed products, stock value, by-category distribution)

---

## Key Features

### Public Site (customer-facing)
| Area | Features |
|---|---|
| **Home** | Editorial hero, category strip, new arrivals bento, trending, promo banner, best sellers, editor's edit, brands marquee, offers, gallery, testimonials, hours + Google map |
| **Products** | Filter by category, brand, gender, price range, and collection flags (Featured / New / Trending / Best Seller / On Offer). Sort by newest / price / name. URL-driven filters (shareable). |
| **Product Detail** | Multi-image gallery + zoom modal, size & color pickers, WhatsApp / Call / Visit / Wishlist CTAs, breadcrumb, material/pattern/fit details, care instructions, related products, share/copy-link |
| **Categories / Brands / Offers / Gallery** | Dedicated listing pages with editorial layouts. Gallery has category tabs + lightbox. |
| **About / Contact / Privacy / Terms / 404** | Full page set. Contact form persists to DB. |
| **Wishlist** | Local (browser) — no login required. Persistent across sessions via `localStorage`. Counter shown in navbar. |
| **Newsletter** | Footer form → backend, deduped by email. |
| **Theme** | Light / dark mode toggle, persisted. |
| **Currency** | Indian Rupee (₹) with `en-IN` digit grouping (e.g. ₹1,29,000). |

### Admin Dashboard (owner-only)
| Area | Features |
|---|---|
| **Login** | JWT auth, demo credentials pre-filled. |
| **Dashboard** | 8 metric cards (Products, Categories, Brands, Offers, Inquiries, Low Stock, Newsletter, Stock Value), by-category bar chart (Recharts), most-viewed products list. |
| **Products** | Rich table with thumbnails; inline stock +/− buttons; full modal form with all fields, flags, multi-image URLs, image previews; create/update/delete. Low-stock filter (`?low=1`). |
| **Categories / Brands / Offers / Banners / Gallery / Testimonials** | Table + modal form CRUD (powered by a reusable `CrudManager`). |
| **Inquiries** | Tabbed by status (new / read / replied / archived), detail modal with mailto/tel links, status transitions, delete. |
| **Store Settings** | Edit store name, tagline, about, email, phone, WhatsApp, address, city/country, map coords, business hours (7-day), 4 social links. |

### Under the hood
- Auto-seeded MongoDB on first startup (admin user + 12 products + 6 categories + 6 brands + 3 offers + 3 banners + 6 gallery items + 3 testimonials + default settings).
- JWT with 7-day expiry, auto-attached via axios interceptor; 401 → auto-redirect to `/admin/login`.
- Product `views` increment on every detail fetch → surfaces in "most viewed" widget.
- Stock adjustments log to a `stock_history` collection for future auditing.
- Search: case-insensitive regex across name / description / SKU / tags.
- SEO-ready: dynamic meta description, Playfair + Manrope preconnected, semantic markup, proper h1 hierarchy.

---

## Screenshots (What you get)

- **Home** — luxury editorial hero, generous whitespace, monochrome + gold accent, Playfair Display headings.
- **Products** — sidebar filters + sortable grid, image-zoom hover.
- **Product detail** — multi-image gallery with click-to-zoom modal, size/color selectors, 4 in-store CTAs.
- **Admin** — dense sidebar layout, tables with inline stock adjust, chart + KPI cards.

Take a screenshot at `/`, `/products`, `/products/onyx-wool-blazer`, `/admin/login`, `/admin`.

---

## Tech Stack

### Frontend
- **React 19** (Create React App via `craco`)
- **React Router 7** — routing
- **TanStack Query 5** — server state + caching
- **Axios** — HTTP client with JWT interceptor
- **Tailwind CSS 3** + **shadcn/ui** primitives — styling
- **Framer Motion** — micro-animations
- **Recharts 3** — analytics chart
- **Sonner** — toast notifications
- **Lucide React** — line icons
- **Playfair Display + Manrope** — typography (Google Fonts)

### Backend
- **FastAPI 0.110** — async web framework
- **Motor 3.3** — async MongoDB driver
- **Pydantic 2** — request/response models & validation
- **PyJWT** + **bcrypt** — auth
- **uvicorn** — ASGI server
- **python-dotenv** — env management

### Database
- **MongoDB** — 12 collections (users, products, categories, brands, offers, gallery, banners, testimonials, inquiries, newsletter, stock_history, settings)

### Deployment (this preview)
- **Supervisor** — process manager
- **Kubernetes ingress** — routes `/api/*` → backend:8001, everything else → frontend:3000
- Hot reload enabled for both services

---

## Folder Structure

```
/app
├── backend/
│   ├── server.py                  # FastAPI app: models, routes, auth, seed_database()
│   ├── requirements.txt
│   └── .env                       # MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET
├── frontend/
│   ├── public/
│   │   └── index.html             # Google Fonts preconnect; SEO meta
│   ├── src/
│   │   ├── App.js                 # Router: public + admin routes
│   │   ├── index.js               # QueryClient + entry
│   │   ├── index.css              # Design tokens (CSS vars), utilities
│   │   ├── lib/
│   │   │   ├── api.js             # Axios client + publicApi wrappers
│   │   │   ├── format.js          # formatINR() helper
│   │   │   └── utils.js           # cn() classnames
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Login / logout / user
│   │   │   ├── WishlistContext.jsx# localStorage wishlist
│   │   │   └── ThemeContext.jsx   # Light / dark
│   │   ├── components/
│   │   │   ├── ProductCard.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── PublicLayout.jsx
│   │   │   │   └── AdminLayout.jsx
│   │   │   ├── admin/
│   │   │   │   └── CrudManager.jsx  # Generic table + modal CRUD
│   │   │   └── ui/                 # shadcn primitives
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Products.jsx
│   │       ├── ProductDetail.jsx
│   │       ├── Categories.jsx
│   │       ├── Brands.jsx
│   │       ├── Offers.jsx
│   │       ├── Gallery.jsx
│   │       ├── About.jsx
│   │       ├── Contact.jsx
│   │       ├── Wishlist.jsx
│   │       ├── Privacy.jsx
│   │       ├── Terms.jsx
│   │       ├── NotFound.jsx
│   │       └── admin/
│   │           ├── AdminLogin.jsx
│   │           ├── AdminDashboard.jsx
│   │           ├── AdminProducts.jsx
│   │           ├── AdminCategories.jsx
│   │           ├── AdminBrands.jsx
│   │           ├── AdminOffers.jsx
│   │           ├── AdminBanners.jsx
│   │           ├── AdminGallery.jsx
│   │           ├── AdminTestimonials.jsx
│   │           ├── AdminInquiries.jsx
│   │           └── AdminSettings.jsx
│   └── package.json
├── memory/
│   ├── PRD.md
│   └── test_credentials.md
└── README.md                      # (this file)
```

---

## Getting Started

The Emergent preview environment already runs this app under **supervisor**. Nothing to install.
The steps below are only for self-hosting.

### Prerequisites
- Python **3.11+**
- Node **18+** and **yarn**
- **MongoDB** running locally on `mongodb://localhost:27017` (or set `MONGO_URL`)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

On first startup, `seed_database()` populates the admin user, categories, brands, products,
offers, banners, gallery, and testimonials automatically.

### 2. Frontend

```bash
cd frontend
yarn install
yarn start        # serves on http://localhost:3000
```

### 3. Open

- Public site: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

---

## Environment Variables

### `backend/.env`
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
JWT_SECRET="change-me-in-production"
```

### `frontend/.env`
```
REACT_APP_BACKEND_URL=https://<your-backend-host>
WDS_SOCKET_PORT=443
```

> `REACT_APP_BACKEND_URL` must **not** include `/api` — the client appends it automatically.

---

## Admin / Demo Credentials

Seeded on first backend boot. The login form pre-fills them for convenience.

| Field | Value |
|---|---|
| URL | `/admin/login` |
| Email | `admin@stylehub.com` |
| Password | `Admin@12345` |
| Role | `admin` |

> Change the password by updating the `users` collection or by editing `seed_database()` and re-seeding after clearing MongoDB.

---

## Seed Data

Auto-created on backend startup (idempotent — only inserts if the collection is empty):

| Collection | Count | Notes |
|---|---|---|
| `users` | 1 | Admin owner |
| `categories` | 6 | Outerwear, Knitwear, Dresses, Shirts, Trousers, Accessories |
| `brands` | 6 | Maison Vela, Nord & Line, Atelier Kōgei, Ravello, House of Ember, Studio Neuve |
| `products` | 12 | Realistic garments with SKUs, sizes, colors, flags, multiple images |
| `offers` | 3 | Cashmere Week, First-Look, Silk Slip Trio |
| `banners` | 3 | 2 hero + 1 promo |
| `gallery` | 6 | Store / event / product |
| `testimonials` | 3 | With avatar, quote, role |
| `settings` | 1 | Default SoHo boutique (edit in `/admin/settings`) |

To reseed: `mongosh <db>` → `db.dropDatabase()` → restart backend.

---

## REST API Reference

Base URL: `${REACT_APP_BACKEND_URL}/api`

### Auth
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Returns `{ access_token, token_type, user }` |
| GET | `/auth/me` | Bearer | Current admin |

### Products
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/products` | Public | List with filters (see below) |
| GET | `/products/{id_or_slug}` | Public | Product detail (increments `views`) |
| GET | `/products/{id}/related` | Public | Related items by category |
| POST | `/products` | Admin | Create |
| PUT | `/products/{id}` | Admin | Update |
| DELETE | `/products/{id}` | Admin | Delete |
| POST | `/products/{id}/stock?delta=N` | Admin | Adjust stock (± N), logs to `stock_history` |

**`GET /products` query params**: `q, category_id, brand_id, gender, min_price, max_price, size, color, featured, trending, new_arrival, best_seller, on_offer, active, sort (newest|price_asc|price_desc|name), limit, skip`

### Generic CRUD endpoints (same shape)
- `GET|POST` `/categories`, `/brands`, `/offers`, `/gallery`, `/banners`, `/testimonials`
- `GET|PUT|DELETE` `/{resource}/{id}` (writes are admin-only)

### Inquiries & Newsletter
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/inquiries` | Public | Submit contact form |
| GET | `/inquiries` | Admin | List (filter by `status_f`) |
| PUT | `/inquiries/{id}?status_v=X` | Admin | Change status |
| DELETE | `/inquiries/{id}` | Admin | Delete |
| POST | `/newsletter` | Public | Subscribe email (deduped) |

### Settings & Analytics
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/settings` | Public | Store settings |
| PUT | `/settings` | Admin | Update settings |
| GET | `/analytics/summary` | Admin | KPIs + by-category + top viewed |

All list endpoints return `{ items: [...], total: N }`.

### Example: authenticated request

```bash
API=https://your-host

# Login
TOKEN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stylehub.com","password":"Admin@12345"}' \
  | jq -r .access_token)

# List all products (including inactive)
curl -s "$API/api/products?limit=100" -H "Authorization: Bearer $TOKEN" | jq

# Adjust stock
curl -s -X POST "$API/api/products/<id>/stock?delta=-2" -H "Authorization: Bearer $TOKEN"
```

---

## Data Models

All documents use a **UUID `id`** as the primary key (not MongoDB's `_id`) and store timestamps as ISO strings (`created_at`, `updated_at`).

### Product
```json
{
  "id": "uuid",
  "name": "Ivory Cashmere Overcoat",
  "slug": "ivory-cashmere-overcoat",
  "sku": "MV-OC-01",
  "description": "...",
  "short_description": "...",
  "brand_id": "uuid|null",
  "category_id": "uuid|null",
  "subcategory_id": null,
  "gender": "men|women|unisex|kids",
  "price": 1290,
  "discount_price": 990,
  "stock": 8,
  "low_stock_threshold": 5,
  "sizes": ["XS","S","M","L"],
  "colors": ["Ivory","Camel"],
  "material": "100% Cashmere",
  "pattern": "Solid",
  "fit": "Relaxed",
  "sleeve": "Long",
  "washing_instructions": "Dry clean only.",
  "images": ["https://...","..."],
  "featured": true,
  "trending": true,
  "new_arrival": true,
  "best_seller": false,
  "on_offer": true,
  "active": true,
  "tags": ["luxury","winter","cashmere"],
  "views": 42,
  "created_at": "...",
  "updated_at": "..."
}
```

Other models (Category, Brand, Offer, Banner, Gallery, Testimonial, Inquiry, Settings) follow the same conventions — see `backend/server.py` for the exact Pydantic classes.

---

## Frontend Architecture

- **Providers stack** (in `App.js`): `ThemeProvider → AuthProvider → WishlistProvider → BrowserRouter`
- **Layouts**: `PublicLayout` (Navbar + Outlet + Footer) and `AdminLayout` (Sidebar + Outlet)
- **Data fetching**: `TanStack Query` everywhere. Cache invalidation on mutation success.
- **Forms**: Uncontrolled `react-hook-form` where useful; plain useState for admin CRUD modal forms.
- **Toasts**: `sonner` (bottom-right).
- **Money formatting**: `formatINR()` in `lib/format.js` — always use this instead of hard-coding `₹` / `$`.
- **Test IDs**: Every interactive element has a `data-testid` (kebab-case). Ideal for E2E automation.

### Adding a new admin CRUD page
1. Add Pydantic model + generic route in `backend/server.py` (use `crud_router()`).
2. Create a new file under `pages/admin/`, define `DEFAULT_ITEM`, `FIELDS`, `COLUMNS` as module-level constants.
3. Return `<CrudManager />` with the endpoint, testIdPrefix, and configs.
4. Register the route in `App.js` and add the link in `AdminLayout.jsx`.

---

## Design System

### Palette (light theme)
- Background: `#FCFCFA` (off-white paper)
- Foreground: `#0A0A0A` (near-black)
- Secondary: `#F3F2F0`
- Muted: `#EAE8E3`
- Gold accent: `hsl(39 42% 55%)` (period-only, editorial dot on the logo, offer eyebrows)

Dark theme mirrors the same tones on a `#0F0F0F` background.

### Typography
- **Headings**: `Playfair Display` — 400 / 500 / 700 / 900, tight tracking
- **Body / UI**: `Manrope` — 300–700
- **Eyebrow labels**: uppercase, `tracking-[0.24em]`, small caps feel

### Motion
- `image-zoom-wrap` hover: 6% scale on 700ms cubic-bezier
- `link-underline`: expanding underline on hover
- `.reveal`: 0.9s upward fade entrance
- `marquee-track`: 40s linear infinite (brands strip)
- Respects `prefers-reduced-motion`

### Rules of the house
- No purple/violet gradients, no Inter body, no centered `text-align: center` on `.App`.
- Sharp corners (`--radius: 0`) — the aesthetic is editorial, not "app-y".
- Generous whitespace: `container-x` = `max-w-[1440px]` with `px-6 → px-14`.

---

## Security

- **Passwords**: bcrypt hashed (`bcrypt.gensalt()`), never stored in plaintext.
- **JWT**: HS256, 7-day expiry, signed with `JWT_SECRET`. Rotate on production.
- **CORS**: configurable via `CORS_ORIGINS` env var.
- **Input validation**: Pydantic 2 on every write endpoint; enum on gender field.
- **Admin-only writes**: `Depends(get_current_admin)` on every mutating admin endpoint.
- **Views increment** does not leak product data — public.
- **XSS**: React escapes by default; no `dangerouslySetInnerHTML` used.
- **Rate limiting / CSRF**: intentionally deferred — see backlog.

---

## Testing

### Backend (pytest)
25 tests covering auth, products (CRUD + filters + slug + related + stock), all CRUD resources, inquiries, newsletter dedupe, settings, analytics.

```bash
cd backend
pytest tests/ -v
```

### Frontend (E2E via automated test agent)
100% pass on documented flows in `PRD.md`. Every interactive element carries a `data-testid`
attribute (see `AdminLogin.jsx`, `ProductDetail.jsx`, etc. for naming conventions).

### Lint
```bash
# Frontend
cd frontend && yarn lint     # ESLint — currently zero errors, zero warnings

# Backend
ruff check backend/ || flake8 backend/
```
